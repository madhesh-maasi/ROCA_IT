declare module "html2canvas" {
  const html2canvas: any;
  export default html2canvas;
}

declare module "jspdf" {
  export const jsPDF: any;
}

declare module "*.module.scss" {
  const classes: { [key: string]: string };
  export default classes;
}
