import postgres from "postgres";
import Request from "../router/Request";
import Response, { StatusCode } from "../router/Response";
import Router from "../router/Router";
import { url } from "inspector";
import Cookie from "../auth/Cookie";
import User, { UserProps } from "../models/User";
import { create } from "domain";

/**
 * Controller for handling Todo CRUD operations.
 * Routes are registered in the `registerRoutes` method.
 * Each method should be called when a request is made to the corresponding route.
 */
export default class PostController {
	private sql: postgres.Sql<any>;

	constructor(sql: postgres.Sql<any>) {
		this.sql = sql;
	}

    /**
	 * To register a route, call the corresponding method on
	 * the router instance based on the HTTP method of the route.
	 *
	 * @param router Router instance to register routes on.
	 *
	 * @example router.get("/todos", this.getTodoList);
	 */
	registerRoutes(router: Router) {
        router.post("/register", this.createUser);
		router.get("/register", this.getRegister);
        router.post("/login", this.loginUser);
		router.get("/login", this.getLogin);
		
	}

    getRegister = async (req: Request, res: Response) => {
        if(req.getSearchParams().toString() == 'error=missing_name'){
			await res.send({
				statusCode: StatusCode.BadRequest,
				message: "Invalid credential",
				template: "registerView",
				payload: { errorMessage: "Username is required."},
			});
			return
		}
		if(req.getSearchParams().toString() == 'error=password_dont_match'){
			await res.send({
				statusCode: StatusCode.BadRequest,
				message: "Invalid credential",
				template: "registerView",
				payload: { errorMessage: "Password dont match."},
			});
			return
		}
		if(req.getSearchParams().toString() == 'error=missing_password'){
			await res.send({
				statusCode: StatusCode.BadRequest,
				message: "missing password",
				template: "registerView",
				payload: { errorMessage: "Password is required."},
			});
			return
		}

        await res.send({
            statusCode: StatusCode.OK,
            message: "User register page",
            template: "registerView"
        });
    }

    createUser = async (req: Request, res: Response) => {

        if(req.body.username == "" || req.body.username == null){
			await res.send({
				statusCode: StatusCode.BadRequest,
				message: "Missing username.",
				redirect: `/register?error=missing_name`
			});
		}
		else if(req.body.password != req.body.confirmPassword){
			await res.send({
				statusCode: StatusCode.BadRequest,
				message: "Passwords do not match",
				redirect: `/register?error=password_dont_match`
			});
		}
		else if(req.body.password == "" || req.body.password == null){
			await res.send({
				statusCode: StatusCode.BadRequest,
				message: "Missing password.",
				redirect: `/register?error=missing_password`
			});
		}
		else{
			let userprops: UserProps = {
				username: req.body.email,
				password: req.body.password
			}

			
			try{
				let myUser = await User.create(this.sql, userprops)
                const userId: Cookie = new Cookie("user_id", `${myUser.props.id}`)
                res.setCookie(userId)
			}catch (error){
				//if the user has entered an email and password the only error left is the duplicate one!
				await res.send({
					statusCode: StatusCode.BadRequest,
					message: "User with this username already exists.",
					redirect: `/register?error=creation_error`
				});
				return
			}

			await res.send({
				statusCode: StatusCode.Created,
				message: "User created",
				redirect: `/projects`
			});
		}
    }

    getLogin = async (req: Request, res: Response) => {
        if(req.getSearchParams().toString() == 'error=missing_name'){
			await res.send({
				statusCode: StatusCode.BadRequest,
				message: "Invalid credential",
				template: "loginView",
				payload: { errorMessage: "Username is required."},
			});
			return
		}
		if(req.getSearchParams().toString() == 'error=login_error'){
			await res.send({
				statusCode: StatusCode.BadRequest,
				message: "bad login",
				template: "loginView",
				payload: { errorMessage: "Password or email is incorrect"},
			});
			return
		}
		if(req.getSearchParams().toString() == 'error=missing_password'){
			await res.send({
				statusCode: StatusCode.BadRequest,
				message: "missing password",
				template: "loginView",
				payload: { errorMessage: "Password is required."},
			});
			return
		}

        await res.send({
            statusCode: StatusCode.OK,
            message: "User register page",
            template: "loginView"
        });
    }

    loginUser = async (req: Request, res: Response) => {

        if(req.body.username == "" || req.body.username == null){
			await res.send({
				statusCode: StatusCode.BadRequest,
				message: "Missing username.",
				redirect: `/login?error=missing_name`
			});
		}
		else if(req.body.password == "" || req.body.password == null){
			await res.send({
				statusCode: StatusCode.BadRequest,
				message: "Missing password.",
				redirect: `/login?error=missing_password`
			});
		}
		else{

			let userprops: UserProps = {
				username: req.body.username,
				password: req.body.password
			}

			
			try{
				let myUser = await User.login(this.sql, userprops.username,userprops.password)
                const userId: Cookie = new Cookie("user_id", `${myUser.props.id}`)
                res.setCookie(userId)
			}catch (error){
				//if the user has entered an email and password the only error left is the duplicate one!
				await res.send({
					statusCode: StatusCode.BadRequest,
					message: "Invalide credential.",
					redirect: `/login?error=login_error`
				});
				return
			}

			await res.send({
				statusCode: StatusCode.Created,
				message: "User created",
				redirect: `/projects`
			});
		}
    }
}    