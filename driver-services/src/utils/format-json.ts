// Input should be JSON of type string or array
export function getStringValueFromJSON(JSONValue: string): string {
  return typeof JSON.parse(JSONValue) === "string"
    ? JSON.parse(JSONValue)
    : JSON.parse(JSONValue).join(", ");
}
