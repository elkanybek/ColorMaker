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
<<<<<<< HEAD
		router.get("/projects/new", this.getNewProjectForm);
		router.post("/projects", this.createProject);
=======
		router.post("/projects", this.createProject);
		router.get("/projects/new", this.getCreateProjectView);

>>>>>>> eed1811 (getting very bad error sos)

		// Any routes that include an `:id` parameter should be registered last.
		router.get("/projects/:id/edit", this.getEditProjectForm);
		router.get("/projects/:id", this.getProject);
		router.put("/projects/:id", this.updateProject);
		router.delete("/projects/:id", this.deleteProject);
		router.put("/projects/:id/complete", this.completeProject);
<<<<<<< HEAD
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
=======

	}

	getProjectList = async (req: Request, res: Response) => {
		let projects: Project[] = []

		try{
			projects = await Project.readAll(this.sql);
		}
		catch (error) {
			await res.send({
				statusCode: StatusCode.BadRequest, 
				message: "Something went wrong", 
				template: "ErrorView", 
				payload: {error: "Something went while getting the projects: "+error}
			})
		}
		await res.send({
			statusCode: StatusCode.OK,
			message: "All Groups",
			template: "ProjectListView",
			payload: { title: "See all the projects!" , projects},
		});
		return;
	};

	
	getProject = async (req: Request, res: Response) => {
		const id = req.getId();
		let project: Project | null = null;

		try {
			project = await Project.read(this.sql, id);
		} catch (error) {
			const message = `Error while getting the project: ${error}`;
>>>>>>> eed1811 (getting very bad error sos)
			console.error(message);
		}

		await res.send({
			statusCode: StatusCode.OK,
			message: "Project retrieved",
<<<<<<< HEAD
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
=======
			template: "ProjectView",
			payload: {
			    id : project?.props.id,
				name: project?.props.name,
				status: project?.props.status,
			},
		});
		return
	};

	getCreateProjectView = async (req: Request, res: Response) => {
		await res.send({
			statusCode: StatusCode.OK,
			message: "New todo form",
			template: "NewProjectView",
			payload: { title: "New Project" },
		});
	};

	createProject = async (req: Request, res: Response) => {
		const session = req.session; 
        const userId = session.get("userId");

		if (!userId) {
			await res.send({
				statusCode: StatusCode.BadRequest,
				message: "Your not login",
				redirect: `/login`,
			});
        }
		let project: Project | null = null;

		// This will be broken until you implement users since it now requires a user ID.
		let projectProps: ProjectProps = {
			name: req.body.name,
			status: req.body.status,
			userId: req.body.userId
		};

		try {
			project = await Project.create(this.sql, projectProps);
		} catch (error) {
			console.error("Error while creating todo:", error);
		}

		await res.send({
			statusCode: StatusCode.Created,
			message: "Todo created successfully!",
			payload: { project: project?.props },
			redirect: `/project/${project?.props.id}`,
		});
	};

	getEditProjectForm = async (req: Request, res: Response) => {
		const id = req.getId();
		let project: Project | null = null;

		try {
			project = await Project.read(this.sql, id);
		} catch (error) {
			const message = `Error while getting project list: ${error}`;
			console.error(message);
		}

		await res.send({
			statusCode: StatusCode.OK,
			message: "Edit project form",
			template: "EditProjectView",
			payload: { project: project?.props, title: "Edit Project" },
		});
>>>>>>> eed1811 (getting very bad error sos)
	};
	
	
	updateProject = async (req: Request, res: Response) => {
		const id = req.getId();
<<<<<<< HEAD
		const userId = req.body.userId || 0;

		const projectProps: Partial<ProjectProps> = {};

		if (req.body.name) {
			projectProps.name = req.body.name;
=======
		const projectprop: Partial<ProjectProps> = {};

		if (req.body.name) {
			projectprop.name = req.body.name;
		}

		if (req.body.status) {
			projectprop.status = req.body.status;
>>>>>>> eed1811 (getting very bad error sos)
		}

		let project: Project | null = null;

<<<<<<< HEAD
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
=======
		try {
			project = await Project.read(this.sql, id);
>>>>>>> eed1811 (getting very bad error sos)
		} catch (error) {
			console.error("Error while updating project:", error);
		}

		try {
<<<<<<< HEAD
			await project?.update(projectProps);
=======
			await project?.update(projectprop);
>>>>>>> eed1811 (getting very bad error sos)
		} catch (error) {
			console.error("Error while updating project:", error);
		}

		await res.send({
			statusCode: StatusCode.OK,
			message: "Project updated successfully!",
<<<<<<< HEAD
			payload: { 
				project: project?.props,
				isSession,
			},
=======
			payload: { project: project?.props },
>>>>>>> eed1811 (getting very bad error sos)
			redirect: `/projects/${id}`,
		});
	};

	deleteProject = async (req: Request, res: Response) => {
		const id = req.getId();
<<<<<<< HEAD
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
=======
		let project: Project | null = null;

		try {
			project = await Project.read(this.sql, id);
>>>>>>> eed1811 (getting very bad error sos)
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
<<<<<<< HEAD
			payload: { 
				project: project?.props, 
				isSession, 
			},
			redirect: "/projects",
=======
			payload: { project: project?.props },
			redirect: "/project",
>>>>>>> eed1811 (getting very bad error sos)
		});
	};

	completeProject = async (req: Request, res: Response) => {
		const id = req.getId();
<<<<<<< HEAD
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
=======
		let project: Project | null = null;

		try {
			project = await Project.read(this.sql, id);
		} catch (error) {
			console.error("Error while marking project as complete:", error);
		}

		try {
			//await project?.markComplete();
		} catch (error) {
			console.error("Error while marking project as complete:", error);
		}

		await res.send({
			statusCode: StatusCode.OK,
			message: "Todo marked as complete!",
			payload: { project: project?.props },
			redirect: `/project/${id}`,
		});
>>>>>>> eed1811 (getting very bad error sos)
	};
}
