import postgres from "postgres";
import {
	camelToSnake,
	convertToCase,
	createUTCDate,
	snakeToCamel,
} from "../utils";
import internal from "stream";

export interface UserProps {
	id?: number;
	name: string;
	password: string;
    projectId: number;
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
			INSERT INTO user
				(name, password) VALUES (${props.name},${props.password})
			RETURNING *;
		`;

		await connection.release()

		return new User(sql, props)
	}

	static async read(sql: postgres.Sql<any>, id: number): Promise<Model> {
		const user = await sql`
			SELECT name, password FROM user WHERE id=${id};
		`
		
		if (!user)
		{
			//error no user found
		}
		
		let props: UserProps = {
            projectId: user[0].id,
			name: user[0].name, 
			password: user[0].password
		}

		return new User(sql, props);
	}

	static async readAll(sql: postgres.Sql<any>): Promise<Model[]> {
		return [new Model(sql, {})];
	}

	async update(updateProps: Partial<ModelProps>) {
	}

	async delete() {
	}
}