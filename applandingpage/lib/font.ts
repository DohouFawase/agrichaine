import localFont from "next/font/local";

export const myCustomFont = localFont({
  src: [
   {
      path: '../assets/monstera/fonts/Montserrat-Regular.woff2', 
      weight: '400',
      style: 'normal',
    },
  ],
  display: "swap",
  variable: "--font-monstera",
});




export const SatoshiCustomFont = localFont({
  src: [
   {
      path: '../assets/satoshi/fonts/Satoshi-Regular.woff2', 
      weight: '400',
      style: 'normal',
    },
  ],
  display: "swap",
  variable: "--font-satoshi",
});


export const TankerCustomFont = localFont({
  src: [
   {
      path: '../assets/Tanker/fonts/Tanker-Regular.woff2', 
      weight: '400',
      style: 'normal',
    },
  ],
  display: "swap",
  variable: "--font-tanker",
});


export const DancingCustomFont = localFont({
  src: [
   {
      path: '../assets/dancing/fonts/DancingScript-Regular.woff2', 
      weight: '400',
      style: 'normal',
    },
  ],
  display: "swap",
  variable: "--font-dancing",
});
