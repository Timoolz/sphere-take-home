export const appEnv = <string>process.env.NODE_ENV;

export const ErrorConfig = {
  reportStackTrace: appEnv !== 'production',
};



export const EnvConfig = {
  jwtKey : <string>process.env.JWT_KEY,

};
