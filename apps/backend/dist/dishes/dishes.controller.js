var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { Controller, Get, Post, Put, Delete, HttpCode, HttpStatus, UseGuards, } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
let DishesController = (() => {
    let _classDecorators = [Controller('dishes'), UseGuards(JwtAuthGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _findAll_decorators;
    let _findOne_decorators;
    let _findByCategory_decorators;
    let _create_decorators;
    let _update_decorators;
    let _remove_decorators;
    let _getCategories_decorators;
    var DishesController = _classThis = class {
        constructor(dishesService) {
            this.dishesService = (__runInitializers(this, _instanceExtraInitializers), dishesService);
        }
        /**
         * GET /dishes
         * Get all dishes with optional filters
         */
        async findAll(category, isActive, search) {
            const filters = {};
            if (category)
                filters.category = category;
            if (isActive !== undefined)
                filters.isActive = isActive === 'true';
            if (search)
                filters.search = search;
            const dishes = await this.dishesService.findAll(filters);
            return {
                success: true,
                data: dishes,
            };
        }
        /**
         * GET /dishes/:id
         * Get single dish by ID
         */
        async findOne(id) {
            const dish = await this.dishesService.findOne(id);
            return {
                success: true,
                data: dish,
            };
        }
        /**
         * GET /dishes/category/:category
         * Get dishes by category
         */
        async findByCategory(category) {
            const dishes = await this.dishesService.findByCategory(category);
            return {
                success: true,
                data: dishes,
            };
        }
        /**
         * POST /dishes
         * Create new dish
         */
        async create(createDishDto) {
            const dish = await this.dishesService.create(createDishDto);
            return {
                success: true,
                data: dish,
                message: 'Dish created successfully',
            };
        }
        /**
         * PUT /dishes/:id
         * Update existing dish
         */
        async update(id, updateDishDto) {
            const dish = await this.dishesService.update(id, updateDishDto);
            return {
                success: true,
                data: dish,
                message: 'Dish updated successfully',
            };
        }
        /**
         * DELETE /dishes/:id
         * Delete dish
         */
        async remove(id) {
            await this.dishesService.remove(id);
            return {
                success: true,
                message: 'Dish deleted successfully',
            };
        }
        /**
         * GET /dishes/stats/categories
         * Get dish categories with counts
         */
        async getCategories() {
            const categories = await this.dishesService.getCategories();
            return {
                success: true,
                data: categories,
            };
        }
    };
    __setFunctionName(_classThis, "DishesController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _findAll_decorators = [Get()];
        _findOne_decorators = [Get(':id')];
        _findByCategory_decorators = [Get('category/:category')];
        _create_decorators = [Post(), HttpCode(HttpStatus.CREATED)];
        _update_decorators = [Put(':id')];
        _remove_decorators = [Delete(':id'), HttpCode(HttpStatus.OK)];
        _getCategories_decorators = [Get('stats/categories')];
        __esDecorate(_classThis, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: obj => "findAll" in obj, get: obj => obj.findAll }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findByCategory_decorators, { kind: "method", name: "findByCategory", static: false, private: false, access: { has: obj => "findByCategory" in obj, get: obj => obj.findByCategory }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: obj => "update" in obj, get: obj => obj.update }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: obj => "remove" in obj, get: obj => obj.remove }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCategories_decorators, { kind: "method", name: "getCategories", static: false, private: false, access: { has: obj => "getCategories" in obj, get: obj => obj.getCategories }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DishesController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DishesController = _classThis;
})();
export { DishesController };
//# sourceMappingURL=dishes.controller.js.map