import { badRequest, bearer, idParam, jsonBody, notFound, okWith, ref, unauthorized } from './common.js'

export const taskSchemas = {
    // ce qu'on envoie pour créer une tâche
    TaskInput: {
        type: 'object',
        required: ['title'],
        properties: {
            title: { type: 'string', minLength: 1, maxLength: 120, example: 'Faire le TP' },
            description: { type: 'string', example: 'Partie backend' },
            status: { type: 'string', enum: ['todo', 'doing', 'done'], default: 'todo', example: 'todo' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium', example: 'medium' },
            deadline: { type: 'string', format: 'date', example: '2026-10-31' },
        },
    },
    // ce qu'on envoie pour modifier une tâche (tous les champs sont facultatifs)
    TaskUpdate: {
        type: 'object',
        properties: {
            title: { type: 'string', minLength: 1, maxLength: 120, example: 'Faire le TP (v2)' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['todo', 'doing', 'done'], example: 'done' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'] },
            deadline: { type: 'string', format: 'date' },
        },
    },
    // ce que renvoie l'API
    Task: {
        type: 'object',
        properties: {
            _id: { type: 'string', example: '6ac75fc0519f2a216455c848' },
            title: { type: 'string', example: 'Faire le TP' },
            description: { type: 'string', example: 'Partie backend' },
            status: { type: 'string', enum: ['todo', 'doing', 'done'], example: 'done' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'], example: 'medium' },
            deadline: { type: 'string', format: 'date-time', example: '2026-10-31T00:00:00.000Z' },
            completedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Rempli par le serveur quand la tâche passe à "done", retiré si elle est rouverte',
                example: '2026-10-08T14:00:00.000Z',
            },
            ownerId: { type: 'string', description: "Id du propriétaire (ajouté par le serveur à partir du token)" },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
        },
    },
}

const taskList = { type: 'array', items: ref('Task') }

export const taskPaths = {
    '/api/tasks': {
        get: {
            tags: ['Tasks'],
            summary: 'Lister ses tâches',
            security: bearer,
            responses: {
                200: okWith('Liste des tâches de l’utilisateur connecté', 'tasks', taskList),
                401: unauthorized,
            },
        },
        post: {
            tags: ['Tasks'],
            summary: 'Créer une tâche',
            security: bearer,
            requestBody: jsonBody(ref('TaskInput')),
            responses: {
                201: okWith('Tâche créée', 'task', ref('Task')),
                400: badRequest('Titre manquant ou trop long, statut ou priorité inconnus'),
                401: unauthorized,
            },
        },
    },
    '/api/tasks/search': {
        get: {
            tags: ['Tasks'],
            summary: 'Rechercher des tâches',
            security: bearer,
            parameters: [
                { name: 'status', in: 'query', schema: { type: 'string', enum: ['todo', 'doing', 'done'] } },
                { name: 'priority', in: 'query', schema: { type: 'string', enum: ['low', 'medium', 'high'] } },
                { name: 'deadline', in: 'query', schema: { type: 'string', format: 'date' } },
            ],
            responses: {
                200: okWith('Tâches trouvées', 'tasks', taskList),
                401: unauthorized,
            },
        },
    },
    '/api/tasks/{taskId}': {
        parameters: [idParam('taskId')],
        get: {
            tags: ['Tasks'],
            summary: "Détail d'une tâche",
            security: bearer,
            responses: {
                200: okWith('Tâche', 'task', ref('Task')),
                401: unauthorized,
                404: notFound,
            },
        },
        patch: {
            tags: ['Tasks'],
            summary: 'Modifier une tâche',
            security: bearer,
            requestBody: jsonBody(ref('TaskUpdate')),
            responses: {
                200: okWith('Tâche modifiée', 'task', ref('Task')),
                400: badRequest(),
                401: unauthorized,
                404: notFound,
            },
        },
        delete: {
            tags: ['Tasks'],
            summary: 'Supprimer une tâche',
            security: bearer,
            responses: {
                200: okWith('Tâche supprimée', 'task', ref('Task')),
                401: unauthorized,
                404: notFound,
            },
        },
    },
}
