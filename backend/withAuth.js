import jwt from 'jsonwebtoken';

import { eq } from 'drizzle-orm';

import { db } from './db/index.js';
import { users } from './db/schema.js';

export const checkToken = async (req, res) => {
    //Get auth header value
    const bearerHeader = req.headers['authorization']; 
    
    console.log('checkToken - bearerHeader:', bearerHeader);
    
    //Check if undefined
    if(typeof bearerHeader !== 'undefined') {
        //Split at the space
        const bearer = bearerHeader.split(' ');
        
        //Get token from array
        const bearerToken = bearer[1];

        //Set the token
        req.token = bearerToken;
        
        console.log('checkToken - Verifying token with secret:', process.env.JWT_SECRET ? 'JWT_SECRET exists' : 'No JWT_SECRET');

        if (!process.env.JWT_SECRET) {
            console.error('CRITICAL: JWT_SECRET not configured!');
            return res.status(500).send({message: 'Server configuration error'});
        }

        jwt.verify(req.token, process.env.JWT_SECRET, async (err, authData) => {
            if(err) {
                console.error('checkToken - JWT verification error:', err.message);
                res.status(403).send({message: 'Access denied: Wrong access token'});
            } else {
                console.log('checkToken - JWT verified successfully for user:', authData.id);
                try {
                    // Fetch fresh user data from database instead of relying on JWT token
                    const [currentUser] = await db.select()
                        .from(users)
                        .where(eq(users.id, authData.id))
                        .limit(1);

                    if (!currentUser) {
                        return res.status(404).send({message: 'User not found'});
                    }

                    // Use fresh data from database
                    const userData = {
                        id: currentUser.id,
                        username: currentUser.username,
                        fullName: currentUser.fullName,
                        fullname: currentUser.fullName, // For compatibility
                        role: currentUser.role,
                        departmentId: currentUser.departmentId,
                        departmentName: null, // We'll populate this if needed
                                                active: currentUser.active
                    };
                    
                    console.log('checkToken returning fresh user data:', userData); // Debug log
                    
                    // Send response in the format the frontend expects
                    res.status(200).send({
                        message: 'Access granted!', 
                        authData: {
                            user: userData
                        }
                    });
                } catch (dbError) {
                    console.error('Database error in checkToken:', dbError);
                    res.status(500).send({message: 'Database error while verifying user'});
                }
            }
        })
    } else {
        res.status(401).send({message: 'Access denied: No token provided'});
    }
}

export const verifyToken = (req, res, next) => {
    //Get auth header value
    const bearerHeader = req.headers['authorization']; 

    //Check if undefined
    if(typeof bearerHeader !== 'undefined') {
        //Split at the space
        const bearer = bearerHeader.split(' ');
        
        //Get token from array
        const bearerToken = bearer[1];

        //Set the token
        req.token = bearerToken;

        if (!process.env.JWT_SECRET) {
            console.error('CRITICAL: JWT_SECRET not configured!');
            return res.status(500).send({message: 'Server configuration error'});
        }

        jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
            if(err) {
                res.status(403).send({message: 'Access denied: Wrong access token'});
            } else {
                req.authData = authData;
                next();
            }
        })
    } else {
        res.status(401).send({message: 'Access denied: No token provided'});
    }
}

export const withRoleAdmin = async (req, res, next) => {
    var authData = req.authData;

    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, authData.id))
      .limit(1);

    if (user) {
        if (user.role === "ROLE_ADMIN") {
            req.authData = authData;
            // Add user data to headers for controller access
            req.headers.user = JSON.stringify({
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                departmentId: user.departmentId,
                            });
            next();
        } else {
            res.status(401).send({ message: "Access denied: Role can't access this api" });
        }
    } else {
        res.status(401).send({ message: "Forbidden" });
    }
}

export const withRoleAdminOrManager = async (req, res, next) => {
    var authData = req.authData;

    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, authData.id))
      .limit(1);

    if(user) {
        if(user.role === "ROLE_ADMIN" || user.role === "ROLE_MANAGER") {
            req.authData = authData;
            // Add user data to headers for controller access
            req.headers.user = JSON.stringify({
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                departmentId: user.departmentId,
                            });
            next();
        } else {
            res.status(401).send({message: "Access denied: Role can't access this api"});
        }
    } else {
        res.status(401).send({message: "Forbidden"});
    }
}

export const withRoleManager = async (req, res, next) => {
    var authData = req.authData;

    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, authData.id))
      .limit(1);

    if(user) {
        if(user.role === "ROLE_MANAGER") {
            req.authData = authData;
            // Add user data to headers for controller access
            req.headers.user = JSON.stringify({
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                departmentId: user.departmentId,
                            });
            next();
        } else {
            res.status(401).send({message: "Access denied: Role can't access this api"});
        }
    } else {
        res.status(401).send({message: "Forbidden"});
    }
}

export const withRoleEmployee = async (req, res, next) => {
    var authData = req.authData;

    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, authData.id))
      .limit(1);

    if(user) {
        if(user.role === "ROLE_EMPLOYEE") {
            req.authData = authData;
            // Add user data to headers for controller access
            req.headers.user = JSON.stringify({
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                departmentId: user.departmentId,
                            });
            next();
        } else {
            res.status(401).send({message: "Access denied: Role can't access this api"});
        }
    } else {
        res.status(401).send({message: "Forbidden"});
    }
}

export const withAnyRole = async (req, res, next) => {
    var authData = req.authData;

    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, authData.id))
      .limit(1);

    if(user) {
        req.authData = authData;
        // Add user data to headers for controller access
        req.headers.user = JSON.stringify({
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            departmentId: user.departmentId,
                    });
        next();
    } else {
        res.status(401).send({message: "Forbidden"});
    }
}

// Generic withAuth middleware that combines verifyToken with role checking
export const withAuth = (req, res, next) => {
    verifyToken(req, res, next);
};

// Generic withRole middleware that accepts an array of allowed roles
export const withRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            const authData = req.authData;
            
            const [user] = await db.select()
                .from(users)
                .where(eq(users.id, authData.id))
                .limit(1);

            if (!user) {
                return res.status(401).send({message: "Forbidden"});
            }

            if (allowedRoles.includes(user.role)) {
                req.authData = authData;
                // Add user data to headers for controller access
                req.headers.user = JSON.stringify({
                    id: user.id,
                    username: user.username,
                    fullName: user.fullName,
                    role: user.role,
                    departmentId: user.departmentId,
                                    });
                next();
            } else {
                res.status(401).send({message: "Access denied: Role can't access this api"});
            }
        } catch (error) {
            console.error('Error in withRole middleware:', error);
            res.status(500).send({message: "Internal server error"});
        }
    };
};