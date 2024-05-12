import postgres from "postgres";

export interface UserProps {
	id?: number;
	name: string;
	password: string;
}

export class DuplicateNameError extends Error {
	constructor() {
		super("User with this name already exists.");
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

		const check = await connection<UserProps[]>`
			SELECT name FROM users Where name = ${props.name};
		`;
		if(check.count != 0){
			throw new DuplicateNameError()
		}

		const [row] = await connection<UserProps[]>`
			INSERT INTO users
				(name, password) VALUES (${props.name},${props.password})
			RETURNING *;
		`;

		await connection.release()

		return new User(sql, props)
	}

	static async read(sql: postgres.Sql<any>, id: number): Promise<User> {
		const user = await sql`
			SELECT name, password FROM users WHERE id=${id};
		`
		
		if (!user)
		{
			//error no user found
		}
		
		let props: UserProps = {
			name: user[0].name, 
			password: user[0].password
		}

		return new User(sql, props);
	}

    static async login(
		sql: postgres.Sql<any>,
		name: string,
		password: string,
	): Promise<User> {

		const check = await sql `
			SELECT name, password, userId FROM users WHERE name=${name} AND password=${password};
		`;
		
		if(check.count == 1){

			let user_props: UserProps = {
				name: name,
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
		if (updateProps.name != undefined) {
			let updatedUser = await this.sql `Update users Set name = ${updateProps.name} where id = ${this.props.id} returning name`
			//make sure that the user exist and there is not mistake with the id
			if (updatedUser[0].name != undefined){
				this.props.name = updatedUser[0].name;
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