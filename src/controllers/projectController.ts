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
		router.post("/projects", this.createProject);
		router.get("/projects/new", this.getCreateProjectView);

		// Any routes that include an `:id` parameter should be registered last.
		router.get("/projects/:id/edit", this.getEditProjectForm);
		router.get("/projects/:id", this.getProject);
		router.put("/projects/:id", this.updateProject);
		router.delete("/projects/:id", this.deleteProject);
		router.put("/projects/:id/complete", this.completeProject);

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
			message: "All Projects",
			template: "ListProjectsView",
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
			console.error(message);
		}

		await res.send({
			statusCode: StatusCode.OK,
			message: "Project retrieved",
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
	};
	
	
	updateProject = async (req: Request, res: Response) => {
		const id = req.getId();
		const projectprop: Partial<ProjectProps> = {};

		if (req.body.name) {
			projectprop.name = req.body.name;
		}

		if (req.body.status) {
			projectprop.status = req.body.status;
		}

		let project: Project | null = null;

		try {
			project = await Project.read(this.sql, id);
		} catch (error) {
			console.error("Error while updating project:", error);
		}

		try {
			await project?.update(projectprop);
		} catch (error) {
			console.error("Error while updating project:", error);
		}

		await res.send({
			statusCode: StatusCode.OK,
			message: "Project updated successfully!",
			payload: { project: project?.props },
			redirect: `/projects/${id}`,
		});
	};

	deleteProject = async (req: Request, res: Response) => {
		const id = req.getId();
		let project: Project | null = null;

		try {
			project = await Project.read(this.sql, id);
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
			payload: { project: project?.props },
			redirect: "/project",
		});
	};

	completeProject = async (req: Request, res: Response) => {
		const id = req.getId();
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
	};
}
