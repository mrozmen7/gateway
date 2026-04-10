package com.bank.identity_service.api;

import com.bank.identity_service.application.AuthenticationService;
import com.bank.identity_service.application.BankUser;
import com.bank.identity_service.security.BankUserPrincipal;
import com.bank.identity_service.security.IdentityJwtTokenService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthenticationService authenticationService;
    private final IdentityJwtTokenService tokenService;

    public AuthController(AuthenticationService authenticationService, IdentityJwtTokenService tokenService) {
        this.authenticationService = authenticationService;
        this.tokenService = tokenService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        BankUser user = authenticationService.authenticate(request.username(), request.password());
        String accessToken = tokenService.createToken(user);

        return new LoginResponse(
                accessToken,
                "Bearer",
                3600,
                user.username(),
                user.role()
        );
    }

    @GetMapping("/me")
    public CurrentUserResponse me(Authentication authentication) {
        BankUserPrincipal principal = (BankUserPrincipal) authentication.getPrincipal();
        return new CurrentUserResponse(
                principal.userId(),
                principal.username(),
                principal.role(),
                principal.tokenId()
        );
    }
}
