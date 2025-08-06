//Centralized error handling 
const errorHandling = (err, req, res, next) => {
    console.error('Error Stack:', err.stack);
    

    if (err.statusCode && err.name) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            error: err.name,
        });
    }
    

    if (err.code) {
        switch (err.code) {
            case '23505': // Unique constraint violation
                return res.status(409).json({
                    success: false,
                    message: 'Duplicate entry - record already exists',
                    error: 'ConflictError',
                });
            case '23503': // Foreign key constraint violation
                return res.status(400).json({
                    success: false,
                    message: 'Invalid reference - related record not found',
                    error: 'ForeignKeyError',
                });
            case '23502': // Not null constraint violation
                return res.status(400).json({
                    success: false,
                    message: 'Required field missing',
                    error: 'NotNullError',
                });
            default:
                console.error('Database Error:', err.code, err.detail);
                break;
        }
    }


    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'InternalServerError',
    });
}

export default errorHandling;
