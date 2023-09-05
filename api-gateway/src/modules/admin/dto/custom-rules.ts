import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsValidPassword(validationOptions?: ValidationOptions) {
  const defaultOptions = {
    message: '$property should contain atleast one capital, one number and one special symbol'
  };
  validationOptions = { ...validationOptions, ...defaultOptions };
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          let regExpCheck = /(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*?])/
          return typeof value === 'string' && regExpCheck.test(value);
        }
      },
    });
  };
}
