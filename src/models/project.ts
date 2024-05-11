import postgres from "postgres";
import {
	camelToSnake,
	convertToCase,
	createUTCDate,
	snakeToCamel,
} from "../utils";

export interface ProjectProps {
	id?: number;
    name: string;
	status: "incomplete" | "complete";
	userId: number;
}

export default class Project {
	constructor(
		private sql: postgres.Sql<any>,
		public props: ProjectProps,
	) {}

	static async create(sql: postgres.Sql<any>, props: ProjectProps) {
		const connection = await sql.reserve();

		props.name = props.name;
		props.userId = props.userId

		console.log(sql(convertToCase(camelToSnake, props)));

		const [row] = await connection<ProjectProps[]>`
			INSERT INTO projects
				${sql(convertToCase(camelToSnake, props))}
			RETURNING *
		`;

		await connection.release();

		return new Project(sql, convertToCase(snakeToCamel, row) as ProjectProps);
	}

	static async read(sql: postgres.Sql<any>, id: number) {
		const connection = await sql.reserve();

		const [row] = await connection<ProjectProps[]>`
			SELECT * FROM
			projects WHERE id = ${id}
		`;

		await connection.release();

		if (!row) {
			return null;
		}

		return new Project(sql, convertToCase(snakeToCamel, row) as ProjectProps);
	}

	static async readAll(
		sql: postgres.Sql<any>,
		userId: number,
		filters?: Partial<ProjectProps>,
		sortBy?: string,
		orderBy?: string,
	): Promise<Project[]> {
		const connection = await sql.reserve();

		const rows = await connection<ProjectProps[]>`
			SELECT *
			FROM projects
		`;

		await connection.release();

		return rows.map(
			(row) =>
				new Project(sql, convertToCase(snakeToCamel, row) as ProjectProps),
		);
	}

	async update(updateProps: Partial<ProjectProps>) {
		const connection = await this.sql.reserve();

		const [row] = await connection`
			UPDATE projects
			SET
				${this.sql(convertToCase(camelToSnake, updateProps))}
			WHERE
				id = ${this.props.id}
			RETURNING *
		`;

		await connection.release();

		this.props = { ...this.props, ...convertToCase(snakeToCamel, row) };
	}

	async delete() {
		const connection = await this.sql.reserve();

		const result = await connection`
			DELETE FROM projects
			WHERE id = ${this.props.id}
		`;

		await connection.release();

		return result.count === 1;
	}

	async markComplete() {
		await this.update({
			status: "complete",
		});
	}
}
