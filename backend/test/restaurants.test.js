"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const restaurants_controller_1 = require("../src/controllers/restaurants.controller");
const restaurants_controller_2 = require("../src/controllers/restaurants.controller");
const db_1 = require("../src/db");
// Mockear la base de datos
jest.mock('../src/db'); // Mockear la base de datos
// Definir el restaurante como una constante
const testRestaurants = [
    {
        id: 1,
        name: 'Café Brasilero',
        latitude: -34.90757,
        longitude: -56.20312,
        description: 'Café histórico con ambiente bohemio',
        seats_total: 40,
        tables_total: 20
    },
    {
        id: 2,
        name: 'La Pasiva',
        latitude: -34.90310,
        longitude: -56.18816,
        description: 'Parrillada tradicional uruguaya',
        seats_total: 60,
        tables_total: 30
    }
];
describe('getById (con mocks)', () => {
    const mockRequest = (params) => ({ params });
    const mockResponse = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };
    it('debería devolver un restaurante si existe', async () => {
        const req = mockRequest({ id: '1' });
        const res = mockResponse();
        // Simular el resultado del query
        db_1.db.query.mockResolvedValue({ rows: [testRestaurants] });
        await (0, restaurants_controller_1.getById)(req, res);
        expect(db_1.db.query).toHaveBeenCalledWith(expect.any(String), ['1']);
        expect(res.json).toHaveBeenCalledWith(testRestaurants);
    });
    it('debería devolver 404 si no se encuentra el restaurante', async () => {
        const req = mockRequest({ id: '999' });
        const res = mockResponse();
        db_1.db.query.mockResolvedValue({ rows: [] });
        await (0, restaurants_controller_1.getById)(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Restaurant not found' });
    });
});
describe('getAll (con mocks)', () => {
    const mockResponse = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };
    it('debería devolver todos los restaurantes', async () => {
        const res = mockResponse();
        db_1.db.query.mockResolvedValue({ rows: testRestaurants });
        await (0, restaurants_controller_2.getAll)({}, res);
        expect(db_1.db.query).toHaveBeenCalledWith(expect.any(String));
        expect(res.json).toHaveBeenCalledWith(testRestaurants);
    });
});
