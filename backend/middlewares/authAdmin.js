import jwt from "jsonwebtoken";

// admin authentication middleware
const authAdmin = (req, res, next) => {
    try {
        const {atoken} = req.headers;
        if(!atoken) {
            return res.status(401).json({success: false, message: 'Unauthorized access'});
        }
        const token_decoded = jwt.verify(atoken, process.env.JWT_SECRET);
        if(token_decoded !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
            return res.status(401).json({success: false, message: 'Unauthorized access'});
        }
        next();
    } catch (error) {
        res.status(401).json({success: false, message: 'Unauthorized'});
    }
};

export default authAdmin;