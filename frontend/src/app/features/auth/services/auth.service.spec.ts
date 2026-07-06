import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should store a token when logging in', (done) => {
    service.login({ email: 'test@example.com', password: 'password123' }).subscribe(() => {
      expect(localStorage.getItem('jobconnect_token')).toBeTruthy();
      done();
    });
  });
});
