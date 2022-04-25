import Ajv from "ajv";
import { ErrorObject, ValidateFunction, AnySchema } from "ajv/dist/types/index";

// schema definations
/* eslint-disable @typescript-eslint/no-var-requires */
const wellsSchema = require("./Wells.json");
const wellLogSchema = require("./WellLog.json");
const wellLogsSchema = require("./WellLogs.json");
const wellLogTemplateSchema = require("./WellLogTemplate.json");
const pieChartSchema = require("./PieChart.json");
const gridSchema = require("./Grid.json");
const faultPolygonsSchema = require("./FaultPolygons.json");
const colorTablesSchema = require("./ColorTables.json");

type Schema = AnySchema & { version: string };

// Validator function accepts parameter data and schema type to be validated against.
// Throws error message of failure.
export function validateSchema(data: any, schema_type: string): void {
    let validator: ValidateFunction<unknown> | null = null;

    try {
        validator = createSchemaValidator(schema_type);
    } catch (e) {
        throw formatSchemaError(schema_type, String(e));
    }

    const required_schema_version = (validator.schema as Schema).version;
    if (data["version"] !== required_schema_version) {
        throw formatSchemaError(
            schema_type,
            `data should have 'version: ${required_schema_version}'`
        );
    }

    validator(data);
    if (validator.errors) {
        throw formatSchemaError(schema_type, validator.errors);
    }
}

function createSchemaValidator(schema_type: string): ValidateFunction<unknown> {
    const ajv = new Ajv({
        schemas: [wellLogSchema], // add list of dependent schemas
    });
    ajv.addKeyword("version");

    switch (schema_type) {
        case "Wells":
            return ajv.compile(wellsSchema);
        case "WellLog":
            return ajv.compile(wellLogSchema);
        case "WellLogs":
            return ajv.compile(wellLogsSchema);
        case "WellLogTemplate":
            return ajv.compile(wellLogTemplateSchema);
        case "PieChart":
            return ajv.compile(pieChartSchema);
        case "Grid":
            return ajv.compile(gridSchema);
        case "FaultPolygons":
            return ajv.compile(faultPolygonsSchema);
        case "ColorTables":
            return ajv.compile(colorTablesSchema);
        default:
            throw "Wrong schema type";
    }
}

function formatSchemaError(
    schema_type: string,
    errors: ErrorObject[] | string
): string {
    let error_text = "";
    if (typeof errors === "object")
        if (errors[0]) {
            error_text =
                (errors[0].dataPath ? errors[0].dataPath + ": " : "") +
                errors[0].message;
        } else error_text = "JSON schema validation failed";
    else {
        error_text = errors;
    }
    return `${schema_type}: ${error_text}`;
}
