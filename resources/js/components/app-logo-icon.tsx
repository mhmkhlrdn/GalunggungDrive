import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/imgs/image.svg"
            alt="App Logo"
            style={{
                width: '6.5rem',
                height: '6.5rem',
                borderRadius: '0.5rem',
                background: 'white',
                ...props.style,
            }}
            {...props}
        />
    );
}
