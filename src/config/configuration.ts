interface Config {
    port: number;
    jwtSecret: string;
}

export default (): Config => {
  const { PORT, JWT_SECRET } = process.env;
  if (!PORT || !JWT_SECRET) {
    throw new Error('Missing environment variables');
  }

  return {
    port: Number(PORT),
    jwtSecret: JWT_SECRET,
    };
};
