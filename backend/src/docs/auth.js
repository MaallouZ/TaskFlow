import { jsonBody, ok, ref } from './common.js'

export const authSchemas = {
    Register: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
            username: { type: 'string', example: 'alice' },
            email: { type: 'string', example: 'alice@example.com' },
            password: { type: 'string', example: 'secret123' },
        },
    },
    Login: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
            username: { type: 'string', example: 'alice' },
            password: { type: 'string', example: 'secret123' },
        },
    },
}

export const authPaths = {
    '/api/auth/register': {
        post: {
            tags: ['Auth'],
            summary: 'Inscription',
            requestBody: jsonBody(ref('Register')),
            responses: {
                201: ok('Utilisateur créé'),
                400: ok('Champs manquants'),
                409: ok('Username ou email déjà utilisé'),
            },
        },
    },
    '/api/auth/login': {
        post: {
            tags: ['Auth'],
            summary: 'Connexion (renvoie un token JWT)',
            requestBody: jsonBody(ref('Login')),
            responses: {
                200: ok('Token JWT'),
                400: ok('Champs manquants'),
                401: ok('Identifiants invalides'),
            },
        },
    },
}
