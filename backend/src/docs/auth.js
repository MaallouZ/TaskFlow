import { jsonBody, ok, ref } from './common.js'

export const authSchemas = {
    Register: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
            username: { type: 'string', example: 'alice' },
            email: { type: 'string', example: 'alice@example.com' },
            password: { type: 'string', example: 'secret123' },
            timezone: { type: 'string', description: 'Fuseau horaire IANA (UTC par défaut)', example: 'Europe/Paris' },
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
                201: {
                    description: 'Utilisateur créé (sans mot de passe ni token)',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    _id: { type: 'string' },
                                    username: { type: 'string', example: 'alice' },
                                    email: { type: 'string', example: 'alice@example.com' },
                                    timezone: { type: 'string', example: 'Europe/Paris' },
                                },
                            },
                        },
                    },
                },
                400: ok('Champs manquants ou fuseau horaire invalide'),
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
                200: {
                    description: 'Token JWT valable 7 jours, à envoyer ensuite dans Authorization: Bearer <token>',
                    content: {
                        'application/json': {
                            schema: { type: 'object', properties: { token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' } } },
                        },
                    },
                },
                400: ok('Champs manquants'),
                401: ok('Identifiants invalides'),
            },
        },
    },
}
