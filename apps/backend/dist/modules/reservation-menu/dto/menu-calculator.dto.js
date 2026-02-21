/**
 * Menu Calculator DTOs
 *
 * Data Transfer Objects for menu price calculation
 */
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
import { IsUUID, IsInt, Min, IsArray, IsOptional, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
let SelectedOptionDto = (() => {
    var _a;
    let _optionId_decorators;
    let _optionId_initializers = [];
    let _optionId_extraInitializers = [];
    let _quantity_decorators;
    let _quantity_initializers = [];
    let _quantity_extraInitializers = [];
    let _customPrice_decorators;
    let _customPrice_initializers = [];
    let _customPrice_extraInitializers = [];
    return _a = class SelectedOptionDto {
            constructor() {
                this.optionId = __runInitializers(this, _optionId_initializers, void 0);
                this.quantity = (__runInitializers(this, _optionId_extraInitializers), __runInitializers(this, _quantity_initializers, 1));
                this.customPrice = (__runInitializers(this, _quantity_extraInitializers), __runInitializers(this, _customPrice_initializers, void 0));
                __runInitializers(this, _customPrice_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _optionId_decorators = [ApiProperty({ description: 'Menu option ID' }), IsUUID()];
            _quantity_decorators = [ApiProperty({ description: 'Quantity of this option', minimum: 1, default: 1 }), IsInt(), Min(1)];
            _customPrice_decorators = [ApiPropertyOptional({ description: 'Custom price override' }), IsOptional(), IsNumber()];
            __esDecorate(null, null, _optionId_decorators, { kind: "field", name: "optionId", static: false, private: false, access: { has: obj => "optionId" in obj, get: obj => obj.optionId, set: (obj, value) => { obj.optionId = value; } }, metadata: _metadata }, _optionId_initializers, _optionId_extraInitializers);
            __esDecorate(null, null, _quantity_decorators, { kind: "field", name: "quantity", static: false, private: false, access: { has: obj => "quantity" in obj, get: obj => obj.quantity, set: (obj, value) => { obj.quantity = value; } }, metadata: _metadata }, _quantity_initializers, _quantity_extraInitializers);
            __esDecorate(null, null, _customPrice_decorators, { kind: "field", name: "customPrice", static: false, private: false, access: { has: obj => "customPrice" in obj, get: obj => obj.customPrice, set: (obj, value) => { obj.customPrice = value; } }, metadata: _metadata }, _customPrice_initializers, _customPrice_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
export { SelectedOptionDto };
let MenuCalculatorRequestDto = (() => {
    var _a;
    let _packageId_decorators;
    let _packageId_initializers = [];
    let _packageId_extraInitializers = [];
    let _adults_decorators;
    let _adults_initializers = [];
    let _adults_extraInitializers = [];
    let _children_decorators;
    let _children_initializers = [];
    let _children_extraInitializers = [];
    let _toddlers_decorators;
    let _toddlers_initializers = [];
    let _toddlers_extraInitializers = [];
    let _selectedOptions_decorators;
    let _selectedOptions_initializers = [];
    let _selectedOptions_extraInitializers = [];
    return _a = class MenuCalculatorRequestDto {
            constructor() {
                this.packageId = __runInitializers(this, _packageId_initializers, void 0);
                this.adults = (__runInitializers(this, _packageId_extraInitializers), __runInitializers(this, _adults_initializers, void 0));
                this.children = (__runInitializers(this, _adults_extraInitializers), __runInitializers(this, _children_initializers, void 0));
                this.toddlers = (__runInitializers(this, _children_extraInitializers), __runInitializers(this, _toddlers_initializers, void 0));
                this.selectedOptions = (__runInitializers(this, _toddlers_extraInitializers), __runInitializers(this, _selectedOptions_initializers, void 0));
                __runInitializers(this, _selectedOptions_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _packageId_decorators = [ApiProperty({ description: 'Menu package ID' }), IsUUID()];
            _adults_decorators = [ApiProperty({ description: 'Number of adults', minimum: 0, default: 0 }), IsInt(), Min(0)];
            _children_decorators = [ApiProperty({ description: 'Number of children', minimum: 0, default: 0 }), IsInt(), Min(0)];
            _toddlers_decorators = [ApiProperty({ description: 'Number of toddlers', minimum: 0, default: 0 }), IsInt(), Min(0)];
            _selectedOptions_decorators = [ApiPropertyOptional({ description: 'Selected menu options', type: [SelectedOptionDto] }), IsOptional(), IsArray(), ValidateNested({ each: true }), Type(() => SelectedOptionDto)];
            __esDecorate(null, null, _packageId_decorators, { kind: "field", name: "packageId", static: false, private: false, access: { has: obj => "packageId" in obj, get: obj => obj.packageId, set: (obj, value) => { obj.packageId = value; } }, metadata: _metadata }, _packageId_initializers, _packageId_extraInitializers);
            __esDecorate(null, null, _adults_decorators, { kind: "field", name: "adults", static: false, private: false, access: { has: obj => "adults" in obj, get: obj => obj.adults, set: (obj, value) => { obj.adults = value; } }, metadata: _metadata }, _adults_initializers, _adults_extraInitializers);
            __esDecorate(null, null, _children_decorators, { kind: "field", name: "children", static: false, private: false, access: { has: obj => "children" in obj, get: obj => obj.children, set: (obj, value) => { obj.children = value; } }, metadata: _metadata }, _children_initializers, _children_extraInitializers);
            __esDecorate(null, null, _toddlers_decorators, { kind: "field", name: "toddlers", static: false, private: false, access: { has: obj => "toddlers" in obj, get: obj => obj.toddlers, set: (obj, value) => { obj.toddlers = value; } }, metadata: _metadata }, _toddlers_initializers, _toddlers_extraInitializers);
            __esDecorate(null, null, _selectedOptions_decorators, { kind: "field", name: "selectedOptions", static: false, private: false, access: { has: obj => "selectedOptions" in obj, get: obj => obj.selectedOptions, set: (obj, value) => { obj.selectedOptions = value; } }, metadata: _metadata }, _selectedOptions_initializers, _selectedOptions_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
export { MenuCalculatorRequestDto };
let PriceBreakdownDto = (() => {
    var _a;
    let _pricePerAdult_decorators;
    let _pricePerAdult_initializers = [];
    let _pricePerAdult_extraInitializers = [];
    let _pricePerChild_decorators;
    let _pricePerChild_initializers = [];
    let _pricePerChild_extraInitializers = [];
    let _pricePerToddler_decorators;
    let _pricePerToddler_initializers = [];
    let _pricePerToddler_extraInitializers = [];
    let _adultsCount_decorators;
    let _adultsCount_initializers = [];
    let _adultsCount_extraInitializers = [];
    let _childrenCount_decorators;
    let _childrenCount_initializers = [];
    let _childrenCount_extraInitializers = [];
    let _toddlersCount_decorators;
    let _toddlersCount_initializers = [];
    let _toddlersCount_extraInitializers = [];
    let _adultsSubtotal_decorators;
    let _adultsSubtotal_initializers = [];
    let _adultsSubtotal_extraInitializers = [];
    let _childrenSubtotal_decorators;
    let _childrenSubtotal_initializers = [];
    let _childrenSubtotal_extraInitializers = [];
    let _toddlersSubtotal_decorators;
    let _toddlersSubtotal_initializers = [];
    let _toddlersSubtotal_extraInitializers = [];
    let _packageTotal_decorators;
    let _packageTotal_initializers = [];
    let _packageTotal_extraInitializers = [];
    return _a = class PriceBreakdownDto {
            constructor() {
                this.pricePerAdult = __runInitializers(this, _pricePerAdult_initializers, void 0);
                this.pricePerChild = (__runInitializers(this, _pricePerAdult_extraInitializers), __runInitializers(this, _pricePerChild_initializers, void 0));
                this.pricePerToddler = (__runInitializers(this, _pricePerChild_extraInitializers), __runInitializers(this, _pricePerToddler_initializers, void 0));
                this.adultsCount = (__runInitializers(this, _pricePerToddler_extraInitializers), __runInitializers(this, _adultsCount_initializers, void 0));
                this.childrenCount = (__runInitializers(this, _adultsCount_extraInitializers), __runInitializers(this, _childrenCount_initializers, void 0));
                this.toddlersCount = (__runInitializers(this, _childrenCount_extraInitializers), __runInitializers(this, _toddlersCount_initializers, void 0));
                this.adultsSubtotal = (__runInitializers(this, _toddlersCount_extraInitializers), __runInitializers(this, _adultsSubtotal_initializers, void 0));
                this.childrenSubtotal = (__runInitializers(this, _adultsSubtotal_extraInitializers), __runInitializers(this, _childrenSubtotal_initializers, void 0));
                this.toddlersSubtotal = (__runInitializers(this, _childrenSubtotal_extraInitializers), __runInitializers(this, _toddlersSubtotal_initializers, void 0));
                this.packageTotal = (__runInitializers(this, _toddlersSubtotal_extraInitializers), __runInitializers(this, _packageTotal_initializers, void 0));
                __runInitializers(this, _packageTotal_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _pricePerAdult_decorators = [ApiProperty({ description: 'Price per adult' })];
            _pricePerChild_decorators = [ApiProperty({ description: 'Price per child' })];
            _pricePerToddler_decorators = [ApiProperty({ description: 'Price per toddler' })];
            _adultsCount_decorators = [ApiProperty({ description: 'Number of adults' })];
            _childrenCount_decorators = [ApiProperty({ description: 'Number of children' })];
            _toddlersCount_decorators = [ApiProperty({ description: 'Number of toddlers' })];
            _adultsSubtotal_decorators = [ApiProperty({ description: 'Subtotal for adults' })];
            _childrenSubtotal_decorators = [ApiProperty({ description: 'Subtotal for children' })];
            _toddlersSubtotal_decorators = [ApiProperty({ description: 'Subtotal for toddlers' })];
            _packageTotal_decorators = [ApiProperty({ description: 'Total package price' })];
            __esDecorate(null, null, _pricePerAdult_decorators, { kind: "field", name: "pricePerAdult", static: false, private: false, access: { has: obj => "pricePerAdult" in obj, get: obj => obj.pricePerAdult, set: (obj, value) => { obj.pricePerAdult = value; } }, metadata: _metadata }, _pricePerAdult_initializers, _pricePerAdult_extraInitializers);
            __esDecorate(null, null, _pricePerChild_decorators, { kind: "field", name: "pricePerChild", static: false, private: false, access: { has: obj => "pricePerChild" in obj, get: obj => obj.pricePerChild, set: (obj, value) => { obj.pricePerChild = value; } }, metadata: _metadata }, _pricePerChild_initializers, _pricePerChild_extraInitializers);
            __esDecorate(null, null, _pricePerToddler_decorators, { kind: "field", name: "pricePerToddler", static: false, private: false, access: { has: obj => "pricePerToddler" in obj, get: obj => obj.pricePerToddler, set: (obj, value) => { obj.pricePerToddler = value; } }, metadata: _metadata }, _pricePerToddler_initializers, _pricePerToddler_extraInitializers);
            __esDecorate(null, null, _adultsCount_decorators, { kind: "field", name: "adultsCount", static: false, private: false, access: { has: obj => "adultsCount" in obj, get: obj => obj.adultsCount, set: (obj, value) => { obj.adultsCount = value; } }, metadata: _metadata }, _adultsCount_initializers, _adultsCount_extraInitializers);
            __esDecorate(null, null, _childrenCount_decorators, { kind: "field", name: "childrenCount", static: false, private: false, access: { has: obj => "childrenCount" in obj, get: obj => obj.childrenCount, set: (obj, value) => { obj.childrenCount = value; } }, metadata: _metadata }, _childrenCount_initializers, _childrenCount_extraInitializers);
            __esDecorate(null, null, _toddlersCount_decorators, { kind: "field", name: "toddlersCount", static: false, private: false, access: { has: obj => "toddlersCount" in obj, get: obj => obj.toddlersCount, set: (obj, value) => { obj.toddlersCount = value; } }, metadata: _metadata }, _toddlersCount_initializers, _toddlersCount_extraInitializers);
            __esDecorate(null, null, _adultsSubtotal_decorators, { kind: "field", name: "adultsSubtotal", static: false, private: false, access: { has: obj => "adultsSubtotal" in obj, get: obj => obj.adultsSubtotal, set: (obj, value) => { obj.adultsSubtotal = value; } }, metadata: _metadata }, _adultsSubtotal_initializers, _adultsSubtotal_extraInitializers);
            __esDecorate(null, null, _childrenSubtotal_decorators, { kind: "field", name: "childrenSubtotal", static: false, private: false, access: { has: obj => "childrenSubtotal" in obj, get: obj => obj.childrenSubtotal, set: (obj, value) => { obj.childrenSubtotal = value; } }, metadata: _metadata }, _childrenSubtotal_initializers, _childrenSubtotal_extraInitializers);
            __esDecorate(null, null, _toddlersSubtotal_decorators, { kind: "field", name: "toddlersSubtotal", static: false, private: false, access: { has: obj => "toddlersSubtotal" in obj, get: obj => obj.toddlersSubtotal, set: (obj, value) => { obj.toddlersSubtotal = value; } }, metadata: _metadata }, _toddlersSubtotal_initializers, _toddlersSubtotal_extraInitializers);
            __esDecorate(null, null, _packageTotal_decorators, { kind: "field", name: "packageTotal", static: false, private: false, access: { has: obj => "packageTotal" in obj, get: obj => obj.packageTotal, set: (obj, value) => { obj.packageTotal = value; } }, metadata: _metadata }, _packageTotal_initializers, _packageTotal_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
export { PriceBreakdownDto };
let OptionPriceDetailDto = (() => {
    var _a;
    let _optionId_decorators;
    let _optionId_initializers = [];
    let _optionId_extraInitializers = [];
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _category_decorators;
    let _category_initializers = [];
    let _category_extraInitializers = [];
    let _priceType_decorators;
    let _priceType_initializers = [];
    let _priceType_extraInitializers = [];
    let _priceAmount_decorators;
    let _priceAmount_initializers = [];
    let _priceAmount_extraInitializers = [];
    let _quantity_decorators;
    let _quantity_initializers = [];
    let _quantity_extraInitializers = [];
    let _calculatedPrice_decorators;
    let _calculatedPrice_initializers = [];
    let _calculatedPrice_extraInitializers = [];
    return _a = class OptionPriceDetailDto {
            constructor() {
                this.optionId = __runInitializers(this, _optionId_initializers, void 0);
                this.name = (__runInitializers(this, _optionId_extraInitializers), __runInitializers(this, _name_initializers, void 0));
                this.category = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _category_initializers, void 0));
                this.priceType = (__runInitializers(this, _category_extraInitializers), __runInitializers(this, _priceType_initializers, void 0));
                this.priceAmount = (__runInitializers(this, _priceType_extraInitializers), __runInitializers(this, _priceAmount_initializers, void 0));
                this.quantity = (__runInitializers(this, _priceAmount_extraInitializers), __runInitializers(this, _quantity_initializers, void 0));
                this.calculatedPrice = (__runInitializers(this, _quantity_extraInitializers), __runInitializers(this, _calculatedPrice_initializers, void 0));
                __runInitializers(this, _calculatedPrice_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _optionId_decorators = [ApiProperty({ description: 'Option ID' })];
            _name_decorators = [ApiProperty({ description: 'Option name' })];
            _category_decorators = [ApiProperty({ description: 'Option category' })];
            _priceType_decorators = [ApiProperty({ description: 'Price type (PER_PERSON, PER_ADULT, PER_CHILD, FLAT_FEE)' })];
            _priceAmount_decorators = [ApiProperty({ description: 'Base price amount' })];
            _quantity_decorators = [ApiProperty({ description: 'Quantity selected' })];
            _calculatedPrice_decorators = [ApiProperty({ description: 'Calculated price for this option' })];
            __esDecorate(null, null, _optionId_decorators, { kind: "field", name: "optionId", static: false, private: false, access: { has: obj => "optionId" in obj, get: obj => obj.optionId, set: (obj, value) => { obj.optionId = value; } }, metadata: _metadata }, _optionId_initializers, _optionId_extraInitializers);
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _category_decorators, { kind: "field", name: "category", static: false, private: false, access: { has: obj => "category" in obj, get: obj => obj.category, set: (obj, value) => { obj.category = value; } }, metadata: _metadata }, _category_initializers, _category_extraInitializers);
            __esDecorate(null, null, _priceType_decorators, { kind: "field", name: "priceType", static: false, private: false, access: { has: obj => "priceType" in obj, get: obj => obj.priceType, set: (obj, value) => { obj.priceType = value; } }, metadata: _metadata }, _priceType_initializers, _priceType_extraInitializers);
            __esDecorate(null, null, _priceAmount_decorators, { kind: "field", name: "priceAmount", static: false, private: false, access: { has: obj => "priceAmount" in obj, get: obj => obj.priceAmount, set: (obj, value) => { obj.priceAmount = value; } }, metadata: _metadata }, _priceAmount_initializers, _priceAmount_extraInitializers);
            __esDecorate(null, null, _quantity_decorators, { kind: "field", name: "quantity", static: false, private: false, access: { has: obj => "quantity" in obj, get: obj => obj.quantity, set: (obj, value) => { obj.quantity = value; } }, metadata: _metadata }, _quantity_initializers, _quantity_extraInitializers);
            __esDecorate(null, null, _calculatedPrice_decorators, { kind: "field", name: "calculatedPrice", static: false, private: false, access: { has: obj => "calculatedPrice" in obj, get: obj => obj.calculatedPrice, set: (obj, value) => { obj.calculatedPrice = value; } }, metadata: _metadata }, _calculatedPrice_initializers, _calculatedPrice_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
export { OptionPriceDetailDto };
let MenuCalculatorResponseDto = (() => {
    var _a;
    let _packageId_decorators;
    let _packageId_initializers = [];
    let _packageId_extraInitializers = [];
    let _packageName_decorators;
    let _packageName_initializers = [];
    let _packageName_extraInitializers = [];
    let _priceBreakdown_decorators;
    let _priceBreakdown_initializers = [];
    let _priceBreakdown_extraInitializers = [];
    let _optionsDetails_decorators;
    let _optionsDetails_initializers = [];
    let _optionsDetails_extraInitializers = [];
    let _optionsTotal_decorators;
    let _optionsTotal_initializers = [];
    let _optionsTotal_extraInitializers = [];
    let _totalGuests_decorators;
    let _totalGuests_initializers = [];
    let _totalGuests_extraInitializers = [];
    let _grandTotal_decorators;
    let _grandTotal_initializers = [];
    let _grandTotal_extraInitializers = [];
    let _averagePerGuest_decorators;
    let _averagePerGuest_initializers = [];
    let _averagePerGuest_extraInitializers = [];
    let _warnings_decorators;
    let _warnings_initializers = [];
    let _warnings_extraInitializers = [];
    return _a = class MenuCalculatorResponseDto {
            constructor() {
                this.packageId = __runInitializers(this, _packageId_initializers, void 0);
                this.packageName = (__runInitializers(this, _packageId_extraInitializers), __runInitializers(this, _packageName_initializers, void 0));
                this.priceBreakdown = (__runInitializers(this, _packageName_extraInitializers), __runInitializers(this, _priceBreakdown_initializers, void 0));
                this.optionsDetails = (__runInitializers(this, _priceBreakdown_extraInitializers), __runInitializers(this, _optionsDetails_initializers, void 0));
                this.optionsTotal = (__runInitializers(this, _optionsDetails_extraInitializers), __runInitializers(this, _optionsTotal_initializers, void 0));
                this.totalGuests = (__runInitializers(this, _optionsTotal_extraInitializers), __runInitializers(this, _totalGuests_initializers, void 0));
                this.grandTotal = (__runInitializers(this, _totalGuests_extraInitializers), __runInitializers(this, _grandTotal_initializers, void 0));
                this.averagePerGuest = (__runInitializers(this, _grandTotal_extraInitializers), __runInitializers(this, _averagePerGuest_initializers, void 0));
                this.warnings = (__runInitializers(this, _averagePerGuest_extraInitializers), __runInitializers(this, _warnings_initializers, void 0));
                __runInitializers(this, _warnings_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _packageId_decorators = [ApiProperty({ description: 'Package ID' })];
            _packageName_decorators = [ApiProperty({ description: 'Package name' })];
            _priceBreakdown_decorators = [ApiProperty({ description: 'Package price breakdown', type: PriceBreakdownDto })];
            _optionsDetails_decorators = [ApiProperty({ description: 'Options price details', type: [OptionPriceDetailDto] })];
            _optionsTotal_decorators = [ApiProperty({ description: 'Total options price' })];
            _totalGuests_decorators = [ApiProperty({ description: 'Total guests count' })];
            _grandTotal_decorators = [ApiProperty({ description: 'Grand total price (package + options)' })];
            _averagePerGuest_decorators = [ApiProperty({ description: 'Average price per guest' })];
            _warnings_decorators = [ApiPropertyOptional({ description: 'Validation warnings', type: [String] })];
            __esDecorate(null, null, _packageId_decorators, { kind: "field", name: "packageId", static: false, private: false, access: { has: obj => "packageId" in obj, get: obj => obj.packageId, set: (obj, value) => { obj.packageId = value; } }, metadata: _metadata }, _packageId_initializers, _packageId_extraInitializers);
            __esDecorate(null, null, _packageName_decorators, { kind: "field", name: "packageName", static: false, private: false, access: { has: obj => "packageName" in obj, get: obj => obj.packageName, set: (obj, value) => { obj.packageName = value; } }, metadata: _metadata }, _packageName_initializers, _packageName_extraInitializers);
            __esDecorate(null, null, _priceBreakdown_decorators, { kind: "field", name: "priceBreakdown", static: false, private: false, access: { has: obj => "priceBreakdown" in obj, get: obj => obj.priceBreakdown, set: (obj, value) => { obj.priceBreakdown = value; } }, metadata: _metadata }, _priceBreakdown_initializers, _priceBreakdown_extraInitializers);
            __esDecorate(null, null, _optionsDetails_decorators, { kind: "field", name: "optionsDetails", static: false, private: false, access: { has: obj => "optionsDetails" in obj, get: obj => obj.optionsDetails, set: (obj, value) => { obj.optionsDetails = value; } }, metadata: _metadata }, _optionsDetails_initializers, _optionsDetails_extraInitializers);
            __esDecorate(null, null, _optionsTotal_decorators, { kind: "field", name: "optionsTotal", static: false, private: false, access: { has: obj => "optionsTotal" in obj, get: obj => obj.optionsTotal, set: (obj, value) => { obj.optionsTotal = value; } }, metadata: _metadata }, _optionsTotal_initializers, _optionsTotal_extraInitializers);
            __esDecorate(null, null, _totalGuests_decorators, { kind: "field", name: "totalGuests", static: false, private: false, access: { has: obj => "totalGuests" in obj, get: obj => obj.totalGuests, set: (obj, value) => { obj.totalGuests = value; } }, metadata: _metadata }, _totalGuests_initializers, _totalGuests_extraInitializers);
            __esDecorate(null, null, _grandTotal_decorators, { kind: "field", name: "grandTotal", static: false, private: false, access: { has: obj => "grandTotal" in obj, get: obj => obj.grandTotal, set: (obj, value) => { obj.grandTotal = value; } }, metadata: _metadata }, _grandTotal_initializers, _grandTotal_extraInitializers);
            __esDecorate(null, null, _averagePerGuest_decorators, { kind: "field", name: "averagePerGuest", static: false, private: false, access: { has: obj => "averagePerGuest" in obj, get: obj => obj.averagePerGuest, set: (obj, value) => { obj.averagePerGuest = value; } }, metadata: _metadata }, _averagePerGuest_initializers, _averagePerGuest_extraInitializers);
            __esDecorate(null, null, _warnings_decorators, { kind: "field", name: "warnings", static: false, private: false, access: { has: obj => "warnings" in obj, get: obj => obj.warnings, set: (obj, value) => { obj.warnings = value; } }, metadata: _metadata }, _warnings_initializers, _warnings_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
export { MenuCalculatorResponseDto };
//# sourceMappingURL=menu-calculator.dto.js.map