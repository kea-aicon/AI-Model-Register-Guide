/**
 * AuthenticationResponse class
 */
export class AuthenticationResponse {
    access_token!: string;
    token_type!: string;
    expired_in!: Date;
    refresh_token!: string;
}