<?php

namespace App\Jobs;

use App\Models\File;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

class ProcessVideo implements ShouldQueue
{

    public $timeout = 600; // 10 minutes

    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $file;

    /**
     * Create a new job instance.
     */
    public function __construct(File $file)
    {
        $this->file = $file;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $file = $this->file->fresh(); // Refresh the file model to get the latest attributes
        Log::info("ProcessVideo job started for file {$file->id}. Original path: {$file->path}");

        $diskKey = $file->storageLocation->diskKey();
        $diskRoot = Storage::disk($diskKey)->path(''); // Correct way to get the root path for a local disk
        Log::info("Disk root for {$diskKey}: {$diskRoot}");
        $originalPath = Storage::disk($diskKey)->path($file->path);
        Log::info("Original file path for FFmpeg: {$originalPath}");
        $hlsDirectory = 'hls/' . $file->id; // Relative to public disk root
        $hlsManifestPath = $hlsDirectory . '/master.m3u8';

        // Update status to processing
        $file->transcoding_status = 'processing';
        $file->save();
        Log::info("File {$file->id} status updated to processing.");

        try {
            // Ensure the HLS directory exists on the 'public' disk
            Storage::disk('public')->makeDirectory($hlsDirectory);
            Log::info("HLS directory created: {$hlsDirectory}");

            $resolutions = [
                '1080p' => ['-vf', 'scale=-2:1080', '-b:v', '5000k'],
                '720p' => ['-vf', 'scale=-2:720', '-b:v', '2800k'],
                '480p' => ['-vf', 'scale=-2:480', '-b:v', '1200k'],
            ];

            $masterPlaylistContent = "#EXTM3U\n#EXT-X-VERSION:3\n";

            foreach ($resolutions as $quality => $params) {
                $outputFile = "{$hlsDirectory}/{$quality}.m3u8";
                $segmentFile = "{$hlsDirectory}/{$quality}_%03d.ts";

                $command = [
                    'ffmpeg',
                    '-i', $originalPath,
                    '-preset', 'veryfast',
                    '-g', '48',
                    '-sc_threshold', '0',
                    '-map', '0:v:0',
                    '-map', '0:a:0',
                    '-c:v', 'libx264',
                    '-c:a', 'aac',
                    '-ar', '48000',
                    '-b:a', '128k',
                    '-f', 'hls',
                    '-hls_time', '10',
                    '-hls_playlist_type', 'vod',
                    '-hls_segment_filename', Storage::disk('public')->path($segmentFile),
                    ...$params,
                    Storage::disk('public')->path($outputFile),
                ];

                Log::info("FFmpeg command for {$quality}: " . implode(' ', $command));

                $process = new Process($command);
                $process->setTimeout(3600); // 1 hour timeout
                $process->run(function ($type, $buffer) use ($quality) {
                    if (Process::ERR === $type) {
                        Log::error("FFmpeg Error ({$quality}): " . $buffer);
                    } else {
                        Log::info("FFmpeg Output ({$quality}): " . $buffer);
                    }
                });

                if (!$process->isSuccessful()) {
                    Log::error("FFmpeg process failed for {$quality}: " . $process->getErrorOutput());
                    throw new \RuntimeException($process->getErrorOutput());
                }
                Log::info("FFmpeg process successful for {$quality}.");

                $masterPlaylistContent .= "#EXT-X-STREAM-INF:BANDWIDTH=" . (intval(str_replace('k', '', $params[3])) * 1000) . ",RESOLUTION=" . str_replace('-2:', '', $params[1]) . "\n";
                $masterPlaylistContent .= "{$quality}.m3u8\n";
            }

            // Save master playlist to the 'public' disk
            Storage::disk('public')->put($hlsManifestPath, $masterPlaylistContent);
            Log::info("Master playlist saved to: {$hlsManifestPath}");

            $file->hls_manifest_path = $hlsManifestPath;
            $file->transcoding_status = 'ready';
            $file->save();

            Log::info("Video {$file->id} transcoded successfully to HLS. Manifest path: {$file->hls_manifest_path}");

        } catch (\Exception $e) {
            $file->transcoding_status = 'failed';
            $file->save();
            Log::error("Video transcoding failed for file {$file->id}: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
        }
    }
}
