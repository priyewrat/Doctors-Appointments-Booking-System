import jwt from "jsonwebtoken";

// user authentication middleware
const authUser = (req, res, next) => {
    try {
        const {token} = req.headers;
        if(!token) {
            return res.status(401).json({success: false, message: 'Unauthorized access'});
        }
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = token_decode.id
        next();
    } catch (error) {
        res.status(401).json({success: false, message:error.message});
    }
};

export default authUser;