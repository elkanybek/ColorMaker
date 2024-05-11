import postgres from "postgres";
import Request from "../router/Request";
import Response, { StatusCode } from "../router/Response";
import Router from "../router/Router";
import { createUTCDate } from "../utils";
import { Session } from "inspector";
import SessionManager from "../auth/SessionManager";
import Cookie from "../auth/Cookie";
import View from "../views/View";

/**
 * Controller for handling Todo CRUD operations.
 * Routes are registered in the `registerRoutes` method.
 * Each method should be called when a request is made to the corresponding route.
 */
export default class ProjectController {
	private sql: postgres.Sql<any>;

	constructor(sql: postgres.Sql<any>) {
		this.sql = sql;
	}

	
	registerRoutes(router: Router) {
		router.get("/projects", this.getProjectList);
		router.get("/todos/new", this.getNewTodoForm);
		router.post("/todos", this.createTodo);

		// Any routes that include an `:id` parameter should be registered last.
		router.get("/todos/:id/edit", this.getEditTodoForm);
		router.get("/todos/:id", this.getTodo);
		router.put("/todos/:id", this.updateTodo);
		router.delete("/todos/:id", this.deleteTodo);
		router.put("/todos/:id/complete", this.completeTodo);
	}

	getNewTodoForm = async (req: Request, res: Response) => {
		const isSession = req.getSession().cookie.name == 'session_id' && 
			req.getSession().cookie.value &&
			req.getSession().data.userId;

		if (!isSession) {
			return await res.send({
				statusCode: StatusCode.Unauthorized,
				message: "Unauthorized",
				redirect: `/login`,
			});
		} 
		await res.send({
			statusCode: StatusCode.OK,
			message: "New todo form",
			template: "NewFormView",
			payload: { 
				title: "New Todo",
				isSession,
			},
		});
	};

	getEditTodoForm = async (req: Request, res: Response) => {
		const id = req.getId();
		const userId = req.body.userId || 0;

		let todo: Todo | null = null;
		const isSession = req.getSession().cookie.name == 'session_id' && 
			req.getSession().cookie.value &&
			req.getSession().data.userId;

		if (!isSession) {
			return await res.send({
				statusCode: StatusCode.Unauthorized,
				message: "Unauthorized",
				redirect: `/login`,
			});
		} 
		
		try {
			todo = await Todo.read(this.sql, id, userId);
		} catch (error) {
			const message = `Error while getting todo list: ${error}`;
			console.error(message);
		}

		await res.send({
			statusCode: StatusCode.OK,
			message: "Edit todo form",
			template: "EditFormView",
			payload: { 
				todo: todo?.props, 
				title: "Edit Todo",
				isSession,
			},
		});
	};

	/**
	 * This method should be called when a GET request is made to /todos.
	 * It should retrieve all todos from the database and send them as a response.
	 *
	 * @param req The request object.
	 * @param res The response object.
	 *
	 * @example GET /todos
	 */
	getProjectList = async (req: Request, res: Response) => {
		const id = req.getId();
		
		let todos: Todo[] = [];
		let uId = req.session.data.userId;
		
		const userId = req.body.userId || 0;
		const isSession = req.getSession().cookie.name == 'session_id' && 
			req.getSession().cookie.value;

		try {
			todos = await Todo.readAll(this.sql, userId);
			if (!isSession || !req.getSession().data.userId) {
				return await res.send({
					statusCode: StatusCode.Unauthorized,
					message: "Unauthorized",
					redirect: `/login`,
				});
			} 	
		} catch (error) {
			const message = `Error while getting todo list: ${error}`;
			console.error(message);
		}

		const todoList = todos.map((todo) => {
			return {
				...todo.props,
				isComplete: todo.props.status === "complete",
			};
		});
		
		await res.send({
			statusCode: StatusCode.OK,
			message: "Todo list retrieved",
			payload: {
				title: "Todo List",
				todos: todoList,
				isSession,
				id: { id: uId},
			},
			template: "ListView",
		});
	};

	/**
	 * This method should be called when a GET request is made to /todos/:id.
	 * It should retrieve a single todo from the database and send it as a response.
	 *
	 * @param req The request object.
	 * @param res The response object.
	 *
	 * @example GET /todos/1
	 */
	getTodo = async (req: Request, res: Response) => {
		const id = req.getId();

		let todo: Todo | null = null;

		if(isNaN(id)){
			return await res.send({
				statusCode: StatusCode.BadRequest,
				message: "Invalid ID",
			});
		}
		const userId = req.body.userId || 0;

		const isSession = req.getSession().cookie.name == 'session_id' && 
			req.getSession().cookie.value;


		try {
			todo = await Todo.read(this.sql, id, userId);
			if(!todo){
				return await res.send({
					statusCode: StatusCode.NotFound,
					message: "Not found",
					payload: {error: "Not Found"},
					template: "ErrorView",
				});
			}

			if (!isSession || !req.getSession().data.userId) {
				return await res.send({
					statusCode: StatusCode.Unauthorized,
					message: "Unauthorized",
					redirect: `/login`,
				});
			}

			if(req.getSession().data.userId != todo.props.userId){
				return await res.send({
					statusCode: StatusCode.Forbidden,
					message: "Forbidden",
					payload: {error: "Forbidden"},
					template: "ErrorView",
				});
			}

			
		} catch (error) {
			const message = `Error while getting todo: ${error}`;
			console.error(message);
		}

		await res.send({
			statusCode: StatusCode.OK,
			message: "Todo retrieved",
			template: "ShowView",
			payload: {
				todo: todo?.props,
				title: todo?.props.title,
				isComplete: todo?.props.status === "complete",
				isSession,
			},
		});
	};

	/**
	 * This method should be called when a POST request is made to /todos.
	 * It should create a new todo in the database and send it as a response.
	 *
	 * @param req The request object.
	 * @param res The response object.
	 *
	 * @example POST /todos { "title": "New Todo", "description": "A new todo" }
	 */
	createTodo = async (req: Request, res: Response) => {
		let todo: Todo | null = null;

		const isSession = req.getSession().cookie.name == 'session_id' && 
			req.getSession().cookie.value &&
			req.getSession().data.userId;

		if (!isSession) {
			return await res.send({
				statusCode: StatusCode.Unauthorized,
				message: "Unauthorized",
				redirect: `/login`,
			});
		} 

		let todoProps: TodoProps = {
			title: req.body.title,
			description: req.body.description,
			status: "incomplete",
			createdAt: createUTCDate(),
			dueAt: req.body.dueAt || new Date(createUTCDate().getTime() + (1000 * 60 * 60 * 24 * 365)),
			userId: parseInt(req.body.userId),
		};

		if (!todoProps.title || !todoProps.description) {
			return await res.send({
				statusCode: StatusCode.BadRequest,
				message: "Request body must include title and description.",
				payload: {
					todoProps,
					error: "Request body must include title and description.",
				},
				template: "ErrorView"
			});
		}
	
		try {
			todo = await Todo.create(this.sql, todoProps, req.getSession().data.userId);
			await res.send({
				statusCode: StatusCode.Created,
				message: "Todo created successfully!",
				payload: { 
					todo: todo.props,
					isSession,
				},
				redirect: `/todos/${todo.props.id}`,
			});
		} catch (error) {
			console.error("Error while creating todo:", error);
		}
	};
	
	

	/**
	 * This method should be called when a PUT request is made to /todos/:id.
	 * It should update an existing todo in the database and send it as a response.
	 *
	 * @param req The request object.
	 * @param res The response object.
	 *
	 * @example PUT /todos/1 { "title": "Updated title" }
	 * @example PUT /todos/1 { "description": "Updated description" }
	 * @example PUT /todos/1 { "title": "Updated title", "dueAt": "2022-12-31" }
	 */
	updateTodo = async (req: Request, res: Response) => {
		const id = req.getId();
		const userId = req.body.userId || 0;

		const todoProps: Partial<TodoProps> = {};

		if (req.body.title) {
			todoProps.title = req.body.title;
		}

		if (req.body.description) {
			todoProps.description = req.body.description;
		}

		let todo: Todo | null = null;

		if(isNaN(id)){
			return await res.send({
				statusCode: StatusCode.BadRequest,
				message: "Invalid ID",
				redirect:`/login`
			});
		}

		const isSession = req.getSession().cookie.name == 'session_id' && 
			req.getSession().cookie.value;

		try {
			todo = await Todo.read(this.sql, id, userId);
			if(!todo){
				return await res.send({
					statusCode: StatusCode.NotFound,
					message: "Not found",
					payload: {error: "Not found",},
					template: "ErrorView",
				});
			}

			if (!isSession || !req.getSession().data.userId) {
				return await res.send({
					statusCode: StatusCode.Unauthorized,
					message: "Unauthorized",
					redirect: `/login`
				});
			}
			
			if(req.getSession().data.userId != todo.props.userId){
				return await res.send({
					statusCode: StatusCode.Forbidden,
					message: "Forbidden",
					payload: {error: "Forbidden",},
					template: "ErrorView",
				});
			}
		} catch (error) {
			console.error("Error while updating todo:", error);
		}

		try {
			await todo?.update(todoProps);
		} catch (error) {
			console.error("Error while updating todo:", error);
		}

		await res.send({
			statusCode: StatusCode.OK,
			message: "Todo updated successfully!",
			payload: { 
				todo: todo?.props,
				isSession,
			},
			redirect: `/todos/${id}`,
		});
	};

	/**
	 * This method should be called when a DELETE request is made to /todos/:id.
	 * It should delete an existing todo from the database.
	 *
	 * @param req The request object.
	 * @param res The response object.
	 *
	 * @example DELETE /todos/1
	 */
	deleteTodo = async (req: Request, res: Response) => {
		const id = req.getId();
		const userId = req.body.userId || 0;

		let todo: Todo | null = null;

		if(isNaN(id)){
			return await res.send({
				statusCode: StatusCode.BadRequest,
				message: "Invalid ID",
			});
		}

		const isSession = req.getSession().cookie.name == 'session_id' && 
			req.getSession().cookie.value;

		try {
			todo = await Todo.read(this.sql, id, userId);
			if(!todo){
				return await res.send({
					statusCode: StatusCode.NotFound,
					message: "Not found",
					payload: {error: "Not found",},
					template: "ErrorView",
				});
			}

			if (!isSession || !req.getSession().data.userId) {
				return await res.send({
					statusCode: StatusCode.Unauthorized,
					message: "Unauthorized",
					payload: {error: "Unauthorized",},
					template: "ErrorView",
				});
			}
			
			if(req.getSession().data.userId != todo.props.userId){
				return await res.send({
					statusCode: StatusCode.Forbidden,
					message: "Forbidden",
					payload: {error: "Forbidden",},
					template: "ErrorView",
				});
			}
		} catch (error) {
			console.error("Error while deleting todo:", error);
		}

		try {
			await todo?.delete();
		} catch (error) {
			console.error("Error while deleting todo:", error);
		}

		await res.send({
			statusCode: StatusCode.OK,
			message: "Todo deleted successfully!",
			payload: { 
				todo: todo?.props, 
				isSession, 
			},
			redirect: "/todos",
		});
	};

	/**
	 * This method should be called when a PUT request is made to /todos/:id/complete.
	 * It should mark an existing todo as complete in the database and send it as a response.
	 *
	 * @param req The request object.
	 * @param res The response object.
	 *
	 * @example PUT /todos/1/complete
	 */
	completeTodo = async (req: Request, res: Response) => {
		const id = req.getId();
		const userId = req.body.userId || 0;

		let todo: Todo | null = null;

		if(isNaN(id)){
			return await res.send({
				statusCode: StatusCode.BadRequest,
				message: "Invalid ID",
				payload: {error: "Invalid ID",},
				template: "ErrorView",
			});
		}

		const isSession = req.getSession().cookie.name == 'session_id' && 
			req.getSession().cookie.value;

		try {
			todo = await Todo.read(this.sql, id, userId);

			if(!todo){
				return await res.send({
					statusCode: StatusCode.NotFound,
					message: "Not found",
					payload: {error: "Not found",},
					template: "ErrorView",
				});
			}

			if (!isSession || !req.getSession().data.userId) {
				return await res.send({
					statusCode: StatusCode.Unauthorized,
					message: "Unauthorized",
					payload: {error: "Unauthorized",},
					template: "ErrorView",
				});
			}
			
			if(req.getSession().data.userId != todo.props.userId){
				return await res.send({
					statusCode: StatusCode.Forbidden,
					message: "Forbidden",
					payload: {error: "Forbidden",},
					template: "ErrorView",
				});
			}

		} catch (error) {
			console.error("Error while marking todo as complete:", error);
		}

		try {
			await todo?.markComplete();
		} catch (error) {
			console.error("Error while marking todo as complete:", error);
		}

		await res.send({
			statusCode: StatusCode.OK,
			message: "Todo marked as complete!",
			payload: { 
				todo: todo?.props, 
				isSession, 
			},
			redirect: `/todos/${id}`,
		});
	};
}
