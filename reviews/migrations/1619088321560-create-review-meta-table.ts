import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class createReviewMetaTable1619088321560 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "user_ratings_meta",
            columns: [
                {
                    name: 'id',
                    type: 'varchar',
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: 'uuid',
                },
                {
                    name: "user_id",
                    type: "varchar",
                    length: "255",
                    isNullable: false,
                    isUnique: true
                },
                {
                    name: "rating",
                    type: "float",
                    default: 0,
                    isNullable: false,
                },
                {
                    name: "review_count",
                    type: "int",
                    default: 0,
                    isNullable: false,
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

        // await queryRunner.createForeignKey("answer", new TableForeignKey({
        //     columnNames: ["user_id"],
        //     referencedColumnNames: ["id"],
        //     referencedTableName: "user",
        //     onDelete: "CASCADE"
        // }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        // const table = await queryRunner.getTable("user_ratings_meta");
        // const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("questionId") !== -1);
        // await queryRunner.dropForeignKey("user_ratings_meta", foreignKey);

        await queryRunner.dropTable("user_ratings_meta");
    }

}
