import * as taskService from '../services/taskService.js'

export async function getAllTasks(request, response) {
    const tasks = await taskService.listTasks(request.userId)
    return response.status(200).json({ message: "Todos récupérées : ", tasks: tasks })
}

export async function createTask(request, response) {
    const task = await taskService.createTask(request.userId, request.body);
    return response.status(201).json({ message: "Todo créée : ", task });
}

export async function getTaskById(request, response) {
    const task = await taskService.getOneTask(
        request.userId,
        request.params.taskId
    )
    
    if (!task) {
        return response.status(404).json({
            message: "Todo introuvable"
        })
    }
    
    return response.status(200).json({message: "Todo récupérée : ", task})
}

export async function searchTasks(request, response) {
    const tasks = await taskService.searchTasks(
        request.userId,
        request.query
    )
    return response.status(200).json({ message: "Todos trouvées : ", tasks: tasks })
}

export async function updateTask(request, response) {
    const updatedTask = await taskService.updateTask(
        request.userId,
        request.params.taskId,
        request.body
    )
    if (!updatedTask) {
        return response.status(404).json({
            message: "Todo introuvable"
        })
    }

    return response.status(200).json({
        message: "Todo mise à jour : ", 
        task: updatedTask
    })
}

export async function deleteTask(request, response) {
    const deletedTask = await taskService.deleteTask(
        request.userId,
        request.params.taskId
    )
    if (!deletedTask) {
        return response.status(404).json({
            message: "Todo introuvable"
        })
    }

    return response.status(200).json({
        message: "Todo supprimée : ", 
        task: deletedTask
    })
}