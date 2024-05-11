import postgres from "postgres";
import {
	camelToSnake,
	convertToCase,
	createUTCDate,
	snakeToCamel,
} from "../utils";

const PAT = '5134e3389d1e421e8a5c999ae1d6b1f5';

const USER_ID = 'skinnypig';       
const APP_ID = 'color-maker';

const MODEL_ID = 'color-recognition';
const MODEL_VERSION_ID = 'dd9458324b4b45c2be1a7ba84d27cd04'; 

export interface ProjectProps {
	id?: number;
    name: string;
	status: "incomplete" | "complete";
    userId: number;
}

export class NotFoundError extends Error {
    constructor() {
        super("Group not found.");
    }
}

export default class Project {
	constructor(
		private sql: postgres.Sql<any>,
		public props: ProjectProps,
	) {}

	static async create(sql: postgres.Sql<any>, props: ProjectProps) {
		const connection = await sql.reserve();

		props.name = props.name;

		console.log(sql(convertToCase(camelToSnake, props)));

		const [row] = await connection<ProjectProps[]>`
			INSERT INTO projects
				${sql(convertToCase(camelToSnake, props))}
			RETURNING *
		`;

		await connection.release();

		return new Project(sql, convertToCase(snakeToCamel, row) as ProjectProps);
	}

	static async read(sql: postgres.Sql<any>, id: number): Promise<Project> {
        const project = await sql 
        `
        SELECT * FROM projects WHERE id=${id};
        `

        if (!project)
        {
            throw new NotFoundError()
        }

        let project_props: ProjectProps = {
            name: project[0].name, 
            status: project[0].status,
            userId: project[0].userId,
        }

        return new Project(sql, project_props as ProjectProps);
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

	async  getImageColors(imageUrl: StaticRangeInit){
        const raw = JSON.stringify({
            "user_app_id": {
                "user_id": USER_ID,
                "app_id": APP_ID
            },
            "inputs": [
                {
                    "data": {
                        "image": {
                            "url": imageUrl
                        }
                    }
                }
            ]
        });

        const requestOptions = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Key ' + PAT
            },
            body: raw
        };

        const response = await fetch("https://api.clarifai.com/v2/models/" + MODEL_ID + "/versions/" + MODEL_VERSION_ID + "/outputs", requestOptions);
        const jsonObject = await response.json();
        return jsonObject.outputs[0].data.colors;
    }
}