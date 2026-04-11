declare module "nodemailer" {
  const nodemailer: {
    createTransport: (...args: any[]) => {
      sendMail: (options: Record<string, unknown>) => Promise<unknown>;
    };
  };

  export default nodemailer;
}
