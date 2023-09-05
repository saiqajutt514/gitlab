import { SelectQueryBuilder } from "typeorm/query-builder/SelectQueryBuilder";

//Declaration Merging Of Module.
declare module 'typeorm/query-builder/SelectQueryBuilder' {
    interface SelectQueryBuilder<Entity> {
        AddDateRange(this: SelectQueryBuilder<Entity>, START_DATE, END_DATE): SelectQueryBuilder<Entity>
        IN(this: SelectQueryBuilder<Entity>, columnName, values): SelectQueryBuilder<Entity>
        IsActive(this: SelectQueryBuilder<Entity>, Active): SelectQueryBuilder<Entity>
        CustomInnerJoinAndSelect(this: SelectQueryBuilder<Entity>, ALIAS, RELATIONS: string[]): SelectQueryBuilder<Entity>
    }
}

//Get Date Range Selection (Add Where Conditions).
SelectQueryBuilder.prototype.AddDateRange = function <Entity>(this: SelectQueryBuilder<Entity>, START_DATE, END_DATE): SelectQueryBuilder<Entity> {
    if (START_DATE != '' && END_DATE != '') {
        this.andWhere(`${this.alias}.date >= :START_DATE && ${this.alias}.date <= :END_DATE`, { START_DATE, END_DATE });
    }
    return this;
}

SelectQueryBuilder.prototype.IN = function <Entity>(this: SelectQueryBuilder<Entity>, columnName, values): SelectQueryBuilder<Entity> {
    if (values.length > 0) this.andWhere(`${this.alias}.${columnName} IN (:...values)`, { values });
    return this;
}

//To Check Active and Inactive Records. Is To be used as First Where Clause.
SelectQueryBuilder.prototype.IsActive = function <Entity>(this: SelectQueryBuilder<Entity>, Active): SelectQueryBuilder<Entity> {
    if (Active != '') this.andWhere(`${this.alias}.active = :Active`, { Active });
    return this
}

//InnerJoinAndSelect For Joining Multiple Relations Of Sub Alias.
SelectQueryBuilder.prototype.CustomInnerJoinAndSelect = function <Entity>(this: SelectQueryBuilder<Entity>, ALIAS, RELATIONS: string[]): SelectQueryBuilder<Entity> {
    return RELATIONS.reduce((acc: any, item: any): any => {
        acc = acc.innerJoinAndSelect(`${ALIAS}.${item}`, `${item}`);
        return acc;
    }, this);

}