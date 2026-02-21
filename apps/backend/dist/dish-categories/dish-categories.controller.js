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
import { Controller, Get, Post, Put, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
let DishCategoriesController = (() => {
    let _classDecorators = [Controller('dish-categories')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _findAll_decorators;
    let _findOne_decorators;
    let _findBySlug_decorators;
    let _create_decorators;
    let _update_decorators;
    let _remove_decorators;
    let _reorder_decorators;
    var DishCategoriesController = _classThis = class {
        constructor(dishCategoriesService) {
            this.dishCategoriesService = (__runInitializers(this, _instanceExtraInitializers), dishCategoriesService);
        }
        /**
         * GET /dish-categories
         * Get all categories (public)
         */
        async findAll() {
            return this.dishCategoriesService.findAll();
        }
        /**
         * GET /dish-categories/:id
         * Get single category (public)
         */
        async findOne(id) {
            return this.dishCategoriesService.findOne(id);
        }
        /**
         * GET /dish-categories/slug/:slug
         * Get category by slug (public)
         */
        async findBySlug(slug) {
            return this.dishCategoriesService.findBySlug(slug);
        }
        /**
         * POST /dish-categories
         * Create new category (protected)
         */
        async create(data) {
            return this.dishCategoriesService.create(data);
        }
        /**
         * PUT /dish-categories/:id
         * Update category (protected)
         */
        async update(id, data) {
            return this.dishCategoriesService.update(id, data);
        }
        /**
         * DELETE /dish-categories/:id
         * Delete category (protected)
         */
        async remove(id) {
            await this.dishCategoriesService.remove(id);
        }
        /**
         * POST /dish-categories/reorder
         * Reorder categories (protected)
         */
        async reorder(data) {
            await this.dishCategoriesService.reorder(data.ids);
        }
    };
    __setFunctionName(_classThis, "DishCategoriesController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _findAll_decorators = [Get()];
        _findOne_decorators = [Get(':id')];
        _findBySlug_decorators = [Get('slug/:slug')];
        _create_decorators = [Post(), UseGuards(AuthGuard)];
        _update_decorators = [Put(':id'), UseGuards(AuthGuard)];
        _remove_decorators = [Delete(':id'), UseGuards(AuthGuard), HttpCode(HttpStatus.NO_CONTENT)];
        _reorder_decorators = [Post('reorder'), UseGuards(AuthGuard), HttpCode(HttpStatus.NO_CONTENT)];
        __esDecorate(_classThis, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: obj => "findAll" in obj, get: obj => obj.findAll }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findBySlug_decorators, { kind: "method", name: "findBySlug", static: false, private: false, access: { has: obj => "findBySlug" in obj, get: obj => obj.findBySlug }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: obj => "update" in obj, get: obj => obj.update }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: obj => "remove" in obj, get: obj => obj.remove }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _reorder_decorators, { kind: "method", name: "reorder", static: false, private: false, access: { has: obj => "reorder" in obj, get: obj => obj.reorder }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DishCategoriesController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DishCategoriesController = _classThis;
})();
export { DishCategoriesController };
//# sourceMappingURL=dish-categories.controller.js.map