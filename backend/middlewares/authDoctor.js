import jwt from "jsonwebtoken";

// doctor authentication middleware
const authDoctor = (req, res, next) => {
    try {
        const {dtoken} = req.headers;
        if(!dtoken) {
            return res.status(401).json({success: false, message: 'Unauthorized access'});
        }
        const  decoded = jwt.verify(dtoken, process.env.JWT_SECRET);
        req.user = { id: decoded.id };
        next();
    } catch (error) {
        res.status(401).json({success: false, message:error.message});
    }
};

export default authDoctor;