import postgres from "postgres";
import Request from "../router/Request";
import Response, { StatusCode } from "../router/Response";
import Router from "../router/Router";
import { createUTCDate } from "../utils";
import { Session } from "inspector";
import SessionManager from "../auth/SessionManager";
import Cookie from "../auth/Cookie";
import View from "../views/View";
import Project, { ProjectProps } from "../models/project";

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
		router.get("/projects/new", this.getNewProjectForm);
		router.post("/projects", this.createProject);

		// Any routes that include an `:id` parameter should be registered last.
		router.get("/projects/:id/edit", this.getEditProjectForm);
		router.get("/projects/:id", this.getProject);
		router.put("/projects/:id", this.updateProject);
		router.delete("/projects/:id", this.deleteProject);
		router.put("/projects/:id/complete", this.completeProject);
	}

	getNewProjectForm = async (req: Request, res: Response) => {
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
			message: "New project todo form",
			template: "NewProjectFormView",
			payload: { 
				title: "New Project",
				isSession,
			},
		});
	};

	getEditProjectForm = async (req: Request, res: Response) => {
		const id = req.getId();
		const userId = req.body.userId || 0;

		let project: Project | null = null;
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
			project = await Project.read(this.sql, id);
		} catch (error) {
			const message = `Error while getting project list: ${error}`;
			console.error(message);
		}

		await res.send({
			statusCode: StatusCode.OK,
			message: "Edit project form",
			template: "EditFormView",
			payload: { 
				project: project?.props, 
				title: "Edit Project",
				isSession,
			},
		});
	};

	getProjectList = async (req: Request, res: Response) => {
		const id = req.getId();
		
		let projects: Project[] = [];
		let uId = req.session.data.userId;
		
		const userId = req.body.userId || 0;
		const isSession = req.getSession().cookie.name == 'session_id' && 
			req.getSession().cookie.value;

		try {
			projects = await Project.readAll(this.sql, userId);
			if (!isSession || !req.getSession().data.userId) {
				return await res.send({
					statusCode: StatusCode.Unauthorized,
					message: "Unauthorized",
					redirect: `/login`,
				});
			} 	
		} catch (error) {
			const message = `Error while getting project list: ${error}`;
			console.error(message);
		}

		const projectList = projects.map((project) => {
			return {
				...project.props,
				isComplete: project.props.status === "complete",
			};
		});
		
		await res.send({
			statusCode: StatusCode.OK,
			message: "Project list retrieved",
			payload: {
				title: "Project List",
				projects: projectList,
				isSession,
				id: { id: uId},
			},
			template: "ListProjectsView",
		});
	};

	getProject = async (req: Request, res: Response) => {
		const id = req.getId();

		let project: Project | null = null;

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
			project = await Project.read(this.sql, id);
			if(!project){
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

			if(req.getSession().data.userId != project.props.userId){
				return await res.send({
					statusCode: StatusCode.Forbidden,
					message: "Forbidden",
					payload: {error: "Forbidden"},
					template: "ErrorView",
				});
			}

			
		} catch (error) {
			const message = `Error while getting project: ${error}`;
			console.error(message);
		}

		await res.send({
			statusCode: StatusCode.OK,
			message: "Project retrieved",
			template: "ShowProjectView",
			payload: {
				project: project?.props,
				name: project?.props.name,
				isComplete: project?.props.status === "complete",
				isSession,
			},
		});
	};

	createProject = async (req: Request, res: Response) => {
		let project: Project | null = null;

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

		let projectProps: ProjectProps = {
			name: req.body.name,
			status: "incomplete",
			userId: parseInt(req.body.userId),
		};

		if (!projectProps.name) {
			return await res.send({
				statusCode: StatusCode.BadRequest,
				message: "Request body must include name.",
				payload: {
					projectProps,
					error: "Request body must include name.",
				},
				template: "ErrorView"
			});
		}
	
		try {
			project = await Project.create(this.sql, projectProps);
			await res.send({
				statusCode: StatusCode.Created,
				message: "Project created successfully!",
				payload: { 
					project: project.props,
					isSession,
				},
				redirect: `/projects/${project.props.id}`,
			});
		} catch (error) {
			console.error("Error while creating project:", error);
		}
	};
	
	
	updateProject = async (req: Request, res: Response) => {
		const id = req.getId();
		const userId = req.body.userId || 0;

		const projectProps: Partial<ProjectProps> = {};

		if (req.body.name) {
			projectProps.name = req.body.name;
		}

		let project: Project | null = null;

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
			project = await Project.read(this.sql, id);
			if(!project){
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
			
			if(req.getSession().data.userId != project.props.userId){
				return await res.send({
					statusCode: StatusCode.Forbidden,
					message: "Forbidden",
					payload: {error: "Forbidden",},
					template: "ErrorView",
				});
			}
		} catch (error) {
			console.error("Error while updating project:", error);
		}

		try {
			await project?.update(projectProps);
		} catch (error) {
			console.error("Error while updating project:", error);
		}

		await res.send({
			statusCode: StatusCode.OK,
			message: "Project updated successfully!",
			payload: { 
				project: project?.props,
				isSession,
			},
			redirect: `/projects/${id}`,
		});
	};

	deleteProject = async (req: Request, res: Response) => {
		const id = req.getId();
		const userId = req.body.userId || 0;

		let project: Project | null = null;

		if(isNaN(id)){
			return await res.send({
				statusCode: StatusCode.BadRequest,
				message: "Invalid ID",
			});
		}

		const isSession = req.getSession().cookie.name == 'session_id' && 
			req.getSession().cookie.value;

		try {
			project = await Project.read(this.sql, id);
			if(!project){
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
			
			if(req.getSession().data.userId != project.props.userId){
				return await res.send({
					statusCode: StatusCode.Forbidden,
					message: "Forbidden",
					payload: {error: "Forbidden",},
					template: "ErrorView",
				});
			}
		} catch (error) {
			console.error("Error while deleting project:", error);
		}

		try {
			await project?.delete();
		} catch (error) {
			console.error("Error while deleting project:", error);
		}

		await res.send({
			statusCode: StatusCode.OK,
			message: "Project deleted successfully!",
			payload: { 
				project: project?.props, 
				isSession, 
			},
			redirect: "/projects",
		});
	};

	completeProject = async (req: Request, res: Response) => {
		const id = req.getId();
		const userId = req.body.userId || 0;

		let project: Project | null = null;

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

		project = await Project.read(this.sql, id);

		if(!project){
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
		
		if(req.getSession().data.userId != project.props.userId){
			return await res.send({
				statusCode: StatusCode.Forbidden,
				message: "Forbidden",
				payload: {error: "Forbidden",},
				template: "ErrorView",
			});
		}
	}
}
