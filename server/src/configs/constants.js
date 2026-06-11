module.exports = {
    authError: {
        unauthorized: 'UNAUTHORIZED',
        notFound: 'NOT_FOUND',
        emailNotVerified: 'EMAIL_NOT_VERIFIED',
        emailAlreadyVerified: 'EMAIL_ALREADY_VERIFIED',
        invalidToken: 'INVALID_TOKEN',
        conflict: 'CONFLICT',
        serverError: 'SERVER_ERROR',
        passwordSame: 'PASSWORD_SAME',
        passwordWrong: 'PASSWORD_WRONG'
    },
    http: {
        ok: 200,
        created: 201,
        noContent: 204,
        unauthorized: 401,
        forbidden: 403,
        notFound: 404,
        conflict: 409,
        unprocessableEntity: 422
    },
    jobStatus: {
        pending: 'pending',
        inprogress: 'inprogress',
        completed: 'completed',
        failed: 'failed'
    },
    chatRole: {
        user: 'user',
        assistant: 'assistant',
        system: 'system'
    }
};
