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
		router.get("/projects/:id", this.getProject);
	}

	getProjectList = async (req: Request, res: Response) => {
		
	};

	
	getProject = async (req: Request, res: Response) => {
		
	};

	createProject = async (req: Request, res: Response) => {
		
	};
	
	updateProject = async (req: Request, res: Response) => {
		
	};

	deleteProject = async (req: Request, res: Response) => {
		
	};

	completeProject = async (req: Request, res: Response) => {
		
	};
}
