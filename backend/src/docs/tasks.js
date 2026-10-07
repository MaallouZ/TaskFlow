import { idParam, jsonBody, notFound, ok, ref } from './common.js'

export const taskSchemas = {
    Task: {
        type: 'object',
        properties: {
            title: { type: 'string', maxLength: 120, example: 'Faire le TP' },
            description: { type: 'string', example: 'Partie backend' },
            status: { type: 'string', enum: ['todo', 'doing', 'done'], example: 'todo' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'], example: 'medium' },
            deadline: { type: 'string', format: 'date', example: '2026-10-31' },
        },
    },
}

export const taskPaths = {
    '/api/tasks': {
        get: {
            tags: ['Tasks'],
            summary: 'Lister ses tâches',
            responses: { 200: ok('Liste des tâches') },
        },
        post: {
            tags: ['Tasks'],
            summary: 'Créer une tâche',
            requestBody: jsonBody(ref('Task')),
            responses: { 201: ok('Tâche créée') },
        },
    },
    '/api/tasks/search': {
        get: {
            tags: ['Tasks'],
            summary: 'Rechercher des tâches',
            parameters: [
                { name: 'status', in: 'query', schema: { type: 'string', enum: ['todo', 'doing', 'done'] } },
                { name: 'priority', in: 'query', schema: { type: 'string', enum: ['low', 'medium', 'high'] } },
                { name: 'deadline', in: 'query', schema: { type: 'string', format: 'date' } },
            ],
            responses: { 200: ok('Tâches trouvées') },
        },
    },
    '/api/tasks/{taskId}': {
        parameters: [idParam('taskId')],
        get: { tags: ['Tasks'], summary: "Détail d'une tâche", responses: { 200: ok('Tâche'), 404: notFound } },
        patch: {
            tags: ['Tasks'],
            summary: 'Modifier une tâche',
            requestBody: jsonBody(ref('Task')),
            responses: { 200: ok('Tâche modifiée'), 404: notFound },
        },
        delete: { tags: ['Tasks'], summary: 'Supprimer une tâche', responses: { 200: ok('Tâche supprimée'), 404: notFound } },
    },
}
