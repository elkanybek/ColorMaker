import postgres from "postgres";

export interface UserProps {
	id?: number;
	username: string;
	password: string;
}

export class DuplicateNameError extends Error {
	constructor() {
		super("User with this username already exists.");
	}
}

export class InvalidCredentialsError extends Error {
	constructor() {
		super("Invalid credentials.");
	}
}

export default class User {
	constructor(
		private sql: postgres.Sql<any>,
		public props: UserProps,
	) {}

	static async create(sql: postgres.Sql<any>, props: UserProps): Promise<User> {
		// getting the connection
		const connection = await sql.reserve();	

		const nowTime = new Date()

		const [check] = await connection<UserProps[]>`
			SELECT * FROM users WHERE username = ${props.username};
		`;
		if(check){
			throw new DuplicateNameError()
		}

		const [row] = await connection<UserProps[]>`
			INSERT INTO users
				(username, password) VALUES (${props.username},${props.password})
			RETURNING *;
		`;

		await connection.release()

		return new User(sql, props)
	}

	static async read(sql: postgres.Sql<any>, id: number): Promise<User> {
		const user = await sql`
			SELECT username, password FROM user WHERE id=${id};
		`
		
		if (!user)
		{
			//error no user found
		}
		
		let props: UserProps = {
			username: user[0].username, 
			password: user[0].password
		}

		return new User(sql, props);
	}

    static async login(
		sql: postgres.Sql<any>,
		username: string,
		password: string,
	): Promise<User> {

		const check = await sql `
			SELECT username, password, id FROM users WHERE username=${username} AND password=${password};
		`;
		
		if(check.count == 1){

			let user_props: UserProps = {
				username: username,
				password: password,
				id: check[0].id
			}

			return new User(sql, user_props)
		}

		throw new InvalidCredentialsError()
	}

	// static async readAll(sql: postgres.Sql<any>): Promise<Model[]> {
	// 	return [new Model(sql, {})];
	// }

	async update(updateProps: Partial<UserProps>) {
        //WE CANT UPDATE THE ID (those field never change).

		//check if user wants to update the title
		if (updateProps.username != undefined) {
			let updatedUser = await this.sql `Update users Set username = ${updateProps.username} where id = ${this.props.id} returning username`
			//make sure that the user exist and there is not mistake with the id
			if (updatedUser[0].username != undefined){
				this.props.username = updatedUser[0].username;
			}
		}

		//check if user wants to update the password 
		if (updateProps.password != undefined) {
			let updatedUser = await this.sql `Update users Set password = ${updateProps.password} where id = ${this.props.id} returning password`
			
			//make sure that the toDo exist and there is not mistake with the id
			if (updatedUser[0].password != undefined){
				this.props.password = updatedUser[0].password;
			}
		}
	}

	async delete() {
        const connection = await this.sql.reserve();

		const result = await connection`
			DELETE FROM users
			WHERE id = ${this.props.id}
		`;

		await connection.release();
	}
}