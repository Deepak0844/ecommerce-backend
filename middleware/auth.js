import jwt from "jsonwebtoken";

export const verifyToken = (request, response, next) => {
  const token = request.header("x-auth-token");
  console.log(token);
  if (token) {
    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
      if (err) {
        response.send({ message: "token is not valid" });
        return;
      }
      request.user = user;
      next();
    });
  } else {
    response.status(401).json({ message: "You are not authenticated!" });
    return;
  }
};

export const authorization = (request, response, next) => {
  verifyToken(request, response, () => {
    if (request.user.id === request.params.id || request.user.isAdmin) {
      //user.id from jwt
      next();
    } else {
      response.send({ message: "you are not allowed to do that" });
    }
  });
};

export const isAdmin = (request, response, next) => {
  verifyToken(request, response, () => {
    if (request.user.isAdmin) {
      //user.id from jwt
      next();
    } else {
      response.send({ message: "you are not allowed to do that" });
    }
  });
};
