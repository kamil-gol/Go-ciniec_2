/**
 * upload.ts middleware tests
 *
 * Strategy:
 * - ensureDirectories() runs at module load → use jest.isolateModules
 * - fileFilter & storage callbacks → capture from multer mock args
 *
 * Path notes:
 * - jest.doMock paths resolve relative to THIS file (src/tests/unit/middlewares/)
 * - logger lives at src/utils/logger.ts → '../../../utils/logger'
 * - upload lives at src/middlewares/upload.ts → '../../../middlewares/upload'
 */
declare let capturedFileFilter: any;
declare let capturedStorageOpts: any;
declare let capturedMulterOpts: any;
declare function createMulterMock(): {
    __esModule: boolean;
    default: any;
};
declare function createLoggerMock(): {
    __esModule: boolean;
    default: {
        info: jest.Mock<any, any, any>;
        warn: jest.Mock<any, any, any>;
        error: jest.Mock<any, any, any>;
        debug: jest.Mock<any, any, any>;
    };
};
declare function loadUpload(fsMock: any, loggerFactory?: () => any): any;
//# sourceMappingURL=upload.test.d.ts.map