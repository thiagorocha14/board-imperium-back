export class Mechanic {
    private constructor(
        readonly id: string,
        readonly name: string,
        readonly description: string | null,
        readonly createdAt: Date,
        readonly updatedAt: Date,
    ) {}

    static rehydrate(input: {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
    }): Mechanic {
        return new Mechanic(
            input.id,
            input.name,
            input.description,
            input.createdAt,
            input.updatedAt,
        );
    }
}
