var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
let DishesService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var DishesService = _classThis = class {
        constructor(prisma) {
            this.prisma = prisma;
        }
        /**
         * Get all dishes with optional filters
         */
        async findAll(filters) {
            const where = {};
            if (filters?.categoryId) {
                where.categoryId = filters.categoryId;
            }
            if (filters?.isActive !== undefined) {
                where.isActive = filters.isActive;
            }
            if (filters?.search) {
                where.OR = [
                    { name: { contains: filters.search, mode: 'insensitive' } },
                    { description: { contains: filters.search, mode: 'insensitive' } },
                ];
            }
            return this.prisma.dish.findMany({
                where,
                include: {
                    category: true,
                },
                orderBy: [
                    { category: { displayOrder: 'asc' } },
                    { name: 'asc' },
                ],
            });
        }
        /**
         * Get single dish by ID
         */
        async findOne(id) {
            const dish = await this.prisma.dish.findUnique({
                where: { id },
                include: {
                    category: true,
                },
            });
            if (!dish) {
                throw new NotFoundException(`Dish with ID ${id} not found`);
            }
            return dish;
        }
        /**
         * Get dishes by category ID
         */
        async findByCategory(categoryId) {
            return this.prisma.dish.findMany({
                where: { categoryId },
                include: {
                    category: true,
                },
                orderBy: { name: 'asc' },
            });
        }
        /**
         * Create new dish
         */
        async create(data) {
            // Check if dish with same name already exists
            const existing = await this.prisma.dish.findFirst({
                where: { name: data.name },
            });
            if (existing) {
                throw new ConflictException(`Dish with name "${data.name}" already exists`);
            }
            // Verify category exists
            const category = await this.prisma.dishCategory.findUnique({
                where: { id: data.categoryId },
            });
            if (!category) {
                throw new NotFoundException(`Category with ID ${data.categoryId} not found`);
            }
            return this.prisma.dish.create({
                data: {
                    name: data.name,
                    description: data.description,
                    categoryId: data.categoryId,
                    allergens: data.allergens || [],
                    isActive: data.isActive ?? true,
                },
                include: {
                    category: true,
                },
            });
        }
        /**
         * Update existing dish
         */
        async update(id, data) {
            // Check if dish exists
            await this.findOne(id);
            // If updating name, check for conflicts
            if (data.name) {
                const existing = await this.prisma.dish.findFirst({
                    where: {
                        name: data.name,
                        NOT: { id },
                    },
                });
                if (existing) {
                    throw new ConflictException(`Dish with name "${data.name}" already exists`);
                }
            }
            // If updating categoryId, verify it exists
            if (data.categoryId) {
                const category = await this.prisma.dishCategory.findUnique({
                    where: { id: data.categoryId },
                });
                if (!category) {
                    throw new NotFoundException(`Category with ID ${data.categoryId} not found`);
                }
            }
            return this.prisma.dish.update({
                where: { id },
                data,
                include: {
                    category: true,
                },
            });
        }
        /**
         * Delete dish
         */
        async remove(id) {
            // Check if dish exists
            await this.findOne(id);
            await this.prisma.dish.delete({
                where: { id },
            });
        }
        /**
         * Get dish categories with counts
         */
        async getCategories() {
            return this.prisma.dishCategory.findMany({
                include: {
                    _count: {
                        select: { dishes: true },
                    },
                },
                orderBy: { displayOrder: 'asc' },
            });
        }
    };
    __setFunctionName(_classThis, "DishesService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DishesService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DishesService = _classThis;
})();
export { DishesService };
//# sourceMappingURL=dishes.service.js.map