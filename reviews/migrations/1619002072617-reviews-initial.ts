import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class reviewsInitial1619002072617 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "feedback_questions",
            columns: [
                {
                    name: 'id',
                    type: 'varchar',
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: 'uuid',
                },
                {
                    name: "title",
                    type: "varchar",
                    length: "255",
                },
                {
                    name: "question_type",
                    type: "enum",
                    enum: ["text", "choice"],
                },
                {
                    name: "choices",
                    type: "text"
                },
                {
                    name: "is_active",
                    type: "boolean",
                    default: true
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: 'now()',
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: 'now()',
                    onUpdate: 'now()'
                },

            ]
        }))
        await queryRunner.createTable(new Table({
            name: "trip_feedback",
            columns: [
                {
                    name: 'id',
                    type: 'varchar',
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: 'uuid',
                },
                {
                    name: "trip_id",
                    type: "varchar",
                    isNullable: false,
                },
                {
                    name: "user_id",
                    type: "varchar",
                    length: "255",
                    isNullable: false,
                },
                {
                    name: "review_by",
                    length: "255",
                    type: "varchar",
                    isNullable: false,
                },
                {
                    name: "overall_rating",
                    type: "float",
                    isNullable: true,
                },
                {
                    name: "title",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "description",
                    type: "text",
                },
                {
                    name: "answers",
                    type: "text"
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: 'now()',
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: 'now()',
                    onUpdate: 'now()'
                },
            ]
        }), true)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("trip_feedback");
        await queryRunner.dropTable("feedback_questions");
    }

}
