import { bearer, idParam, jsonBody, notFound, ok, ref, unauthorized } from './common.js'

export const userSchemas = {
    User: {
        type: 'object',
        properties: {
            username: { type: 'string', maxLength: 30, example: 'alice' },
            email: { type: 'string', maxLength: 100, example: 'alice@example.com' },
            password: { type: 'string', example: 'secret123' },
            timezone: { type: 'string', description: 'Fuseau horaire IANA', example: 'Europe/Paris' },
        },
    },
}

export const userPaths = {
    '/api/users/me': {
        get: {
            tags: ['Users'],
            summary: 'Utilisateur connecté',
            security: bearer,
            responses: { 200: ok('Utilisateur'), 401: unauthorized, 404: notFound },
        },
    },
    '/api/users': {
        get: {
            tags: ['Users'],
            summary: 'Lister les utilisateurs',
            security: bearer,
            responses: { 200: ok('Liste des utilisateurs'), 401: unauthorized },
        },
        post: {
            tags: ['Users'],
            summary: 'Créer un utilisateur',
            security: bearer,
            requestBody: jsonBody(ref('User')),
            responses: { 201: ok('Utilisateur créé'), 400: ok('Données invalides'), 401: unauthorized, 409: ok('Doublon') },
        },
    },
    '/api/users/{id}': {
        parameters: [idParam('id')],
        get: {
            tags: ['Users'],
            summary: "Détail d'un utilisateur",
            security: bearer,
            responses: { 200: ok('Utilisateur'), 400: ok('Id invalide'), 401: unauthorized, 404: notFound },
        },
        put: {
            tags: ['Users'],
            summary: 'Modifier un utilisateur',
            security: bearer,
            requestBody: jsonBody(ref('User')),
            responses: { 200: ok('Utilisateur modifié'), 400: ok('Données invalides'), 401: unauthorized, 404: notFound },
        },
        delete: {
            tags: ['Users'],
            summary: 'Supprimer un utilisateur',
            security: bearer,
            responses: { 204: ok('Supprimé'), 401: unauthorized, 404: notFound },
        },
    },
}
