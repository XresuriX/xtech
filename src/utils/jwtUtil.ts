import type { JwtPayload } from 'jwt-decode';
import { jwtDecode } from 'jwt-decode';
export const decodeJWT = (token: string): Promise<JwtPayload | null> => {
    return new Promise((resolve) => {
        if (token) {
            const decodedToken = jwtDecode<JwtPayload>(token);
            resolve(decodedToken);
        } else {
            resolve(null);
        }
    });
};
