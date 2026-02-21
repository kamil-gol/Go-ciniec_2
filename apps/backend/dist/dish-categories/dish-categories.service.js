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
let DishCategoriesService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var DishCategoriesService = _classThis = class {
        constructor(prisma) {
            this.prisma = prisma;
        }
        /**
         * Get all categories
         */
        async findAll() {
            return this.prisma.dishCategory.findMany({
                include: {
                    _count: {
                        select: { dishes: true },
                    },
                },
                orderBy: { displayOrder: 'asc' },
            });
        }
        /**
         * Get single category by ID
         */
        async findOne(id) {
            const category = await this.prisma.dishCategory.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: { dishes: true },
                    },
                },
            });
            if (!category) {
                throw new NotFoundException(`Category with ID ${id} not found`);
            }
            return category;
        }
        /**
         * Get category by slug
         */
        async findBySlug(slug) {
            const category = await this.prisma.dishCategory.findUnique({
                where: { slug },
                include: {
                    _count: {
                        select: { dishes: true },
                    },
                },
            });
            if (!category) {
                throw new NotFoundException(`Category with slug "${slug}" not found`);
            }
            return category;
        }
        /**
         * Create new category
         */
        async create(data) {
            // Check if category with same slug already exists
            const existing = await this.prisma.dishCategory.findUnique({
                where: { slug: data.slug },
            });
            if (existing) {
                throw new ConflictException(`Category with slug "${data.slug}" already exists`);
            }
            return this.prisma.dishCategory.create({
                data: {
                    slug: data.slug.toUpperCase(),
                    name: data.name,
                    icon: data.icon,
                    color: data.color,
                    displayOrder: data.displayOrder ?? 0,
                    isActive: data.isActive ?? true,
                },
            });
        }
        /**
         * Update existing category
         */
        async update(id, data) {
            // Check if category exists
            await this.findOne(id);
            // If updating slug, check for conflicts
            if (data.slug) {
                const existing = await this.prisma.dishCategory.findFirst({
                    where: {
                        slug: data.slug.toUpperCase(),
                        NOT: { id },
                    },
                });
                if (existing) {
                    throw new ConflictException(`Category with slug "${data.slug}" already exists`);
                }
                // Uppercase the slug
                data.slug = data.slug.toUpperCase();
            }
            return this.prisma.dishCategory.update({
                where: { id },
                data,
            });
        }
        /**
         * Delete category
         */
        async remove(id) {
            // Check if category exists
            const category = await this.findOne(id);
            // Check if category has dishes
            if (category._count.dishes > 0) {
                throw new ConflictException(`Cannot delete category "${category.name}" because it has ${category._count.dishes} dish(es) assigned`);
            }
            await this.prisma.dishCategory.delete({
                where: { id },
            });
        }
        /**
         * Reorder categories
         */
        async reorder(orderedIds) {
            const updates = orderedIds.map((id, index) => this.prisma.dishCategory.update({
                where: { id },
                data: { displayOrder: index },
            }));
            await this.prisma.$transaction(updates);
        }
    };
    __setFunctionName(_classThis, "DishCategoriesService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DishCategoriesService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DishCategoriesService = _classThis;
})();
export { DishCategoriesService };
//# sourceMappingURL=dish-categories.service.js.map