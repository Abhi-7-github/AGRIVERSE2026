export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
    
    if (field === 'teamNameNormalized' || field === 'teamName') {
      message = 'Team name already exists. Please choose a different team name.';
    } else if (field === 'transactionId') {
      message = 'This Transaction ID has already been submitted. Please check and try again.';
    } else if (field === 'registrationId') {
      message = 'A collision occurred with the Registration ID. Please retry submission.';
    } else if (field === 'members.registerNumber' || field === 'registerNumber') {
      message = 'One or more student register numbers are already registered with another team.';
    } else if (field === 'members.email' || field === 'email') {
      message = 'One or more student email addresses are already registered with another team.';
    } else if (field === 'username') {
      message = 'Username already exists.';
    } else {
      message = `Duplicate value entered for ${field}. Please use a unique value.`;
    }
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((val) => val.message);
    message = errors.join(', ');
  }

  // Handle CastError
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with ID of ${err.value}`;
  }

  console.error(`[Error] ${req.method} ${req.originalUrl} - ${statusCode}: ${message}`);
  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
