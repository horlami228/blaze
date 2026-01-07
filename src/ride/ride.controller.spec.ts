import { Test, TestingModule } from '@nestjs/testing';
import { RideController } from './ride.controller';
import { RideService } from './ride.service';
import { RidesGateway } from './rides.gateway';
import { RequestRideDto } from './dto/request-ride-dto';
import { UpdateDriverLocationDto } from 'src/driver/dto/update-driver-location-dto';

describe('RideController', () => {
  let controller: RideController;
  let service: RideService;
  let gateway: RidesGateway;

  const mockRideService = {
    updateDriverLocation: jest.fn(),
    toggleDriverAvailability: jest.fn(),
    requestRide: jest.fn(),
    acceptRide: jest.fn(),
    startRide: jest.fn(),
    cancelRide: jest.fn(),
    completeRide: jest.fn(),
  };

  const mockRidesGateway = {
    sendNotification: jest.fn(),
  };

  const mockRequest = {
    user: {
      sub: 'user-1',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RideController],
      providers: [
        { provide: RideService, useValue: mockRideService },
        { provide: RidesGateway, useValue: mockRidesGateway },
      ],
    }).compile();

    controller = module.get<RideController>(RideController);
    service = module.get<RideService>(RideService);
    gateway = module.get<RidesGateway>(RidesGateway);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updateDriverLocation', () => {
    it('should call service.updateDriverLocation', async () => {
      const dto: UpdateDriverLocationDto = {
        latitude: 10,
        longitude: 10,
        heading: 0,
        speed: 0,
      };
      mockRideService.updateDriverLocation.mockResolvedValue({
        message: 'Updated',
      });

      const result = await controller.updateDriverLocation(dto, mockRequest);

      expect(service.updateDriverLocation).toHaveBeenCalledWith('user-1', dto);
      expect(result.message).toBe('Updated');
    });
  });

  describe('toggleAvailability', () => {
    it('should call service.toggleDriverAvailability', async () => {
      mockRideService.toggleDriverAvailability.mockResolvedValue({
        message: 'Toggled',
      });

      const result = await controller.toggleAvailability(mockRequest);

      expect(service.toggleDriverAvailability).toHaveBeenCalledWith('user-1');
      expect(result.message).toBe('Toggled');
    });
  });

  describe('requestRide', () => {
    it('should call service.requestRide', async () => {
      const dto: RequestRideDto = {
        pickupLatitude: 1,
        pickupLongitude: 1,
        pickupAddress: 'A',
        dropoffLatitude: 2,
        dropoffLongitude: 2,
        dropoffAddress: 'B',
      };
      mockRideService.requestRide.mockResolvedValue({ message: 'Requested' });

      const result = await controller.requestRide(dto, mockRequest);

      expect(service.requestRide).toHaveBeenCalledWith('user-1', dto);
      expect(result.message).toBe('Requested');
    });
  });

  describe('acceptRide', () => {
    it('should call service.acceptRide', async () => {
      mockRideService.acceptRide.mockResolvedValue({ message: 'Accepted' });

      const result = await controller.acceptRide('ride-1', mockRequest);

      expect(service.acceptRide).toHaveBeenCalledWith('user-1', 'ride-1');
      expect(result.message).toBe('Accepted');
    });
  });

  describe('startRide', () => {
    it('should call service.startRide', async () => {
      mockRideService.startRide.mockResolvedValue({ message: 'Started' });

      const result = await controller.startRide('ride-1', mockRequest);

      expect(service.startRide).toHaveBeenCalledWith('user-1', 'ride-1');
      expect(result.message).toBe('Started');
    });
  });

  describe('cancelRide', () => {
    it('should call service.cancelRide', async () => {
      mockRideService.cancelRide.mockResolvedValue({ message: 'Canceled' });

      const result = await controller.cancelRide('ride-1', mockRequest);

      expect(service.cancelRide).toHaveBeenCalledWith('user-1', 'ride-1');
      expect(result.message).toBe('Canceled');
    });
  });

  describe('completeRide', () => {
    it('should call service.completeRide', async () => {
      mockRideService.completeRide.mockResolvedValue({ message: 'Completed' });

      const result = await controller.completeRide('ride-1', mockRequest);

      expect(service.completeRide).toHaveBeenCalledWith('user-1', 'ride-1');
      expect(result.message).toBe('Completed');
    });
  });

  describe('sendTestNotification', () => {
    it('should use gateway to send notification', async () => {
      const result = await controller.sendTestNotification(mockRequest);

      expect(gateway.sendNotification).toHaveBeenCalledWith('user-1', {
        title: 'testing',
        message: 'if this works, then the websocket is working',
      });
      expect(result.success).toBe(true);
    });
  });
});
