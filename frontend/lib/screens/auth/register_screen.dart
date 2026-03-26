import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/glass_container.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameC = TextEditingController();
  final _emailC = TextEditingController();
  final _passC = TextEditingController();
  final _countryC = TextEditingController(text: 'Tunisia');
  bool _obscure = true;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.only(left: 16.0),
          child: IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.8),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white, width: 1.5),
              ),
              child: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: AppColors.textPrimary),
            ),
            onPressed: () => Navigator.pop(context),
          ).animate().fadeIn(delay: 200.ms),
        ),
      ),
      body: Stack(
        children: [
          // Dynamic Background
          Container(
            width: double.infinity,
            height: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.background, Color(0xFFF3E5D8)],
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
              ),
            ),
          ),
          
          // Animated decorative blobs
          Positioned(
            top: 50,
            left: -50,
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [AppColors.accent.withOpacity(0.4), Colors.transparent],
                ),
              ),
            ).animate(onPlay: (c) => c.repeat(reverse: true))
             .moveX(begin: 0, end: 30, duration: 4.seconds)
             .moveY(begin: 0, end: 20, duration: 5.seconds),
          ),
          Positioned(
            bottom: -50,
            right: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [AppColors.primary.withOpacity(0.3), Colors.transparent],
                ),
              ),
            ).animate(onPlay: (c) => c.repeat(reverse: true))
             .moveX(begin: 0, end: -40, duration: 6.seconds)
             .moveY(begin: 0, end: -20, duration: 4.5.seconds),
          ),

          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
                child: GlassContainer(
                  blur: 20,
                  opacity: 0.6,
                  padding: const EdgeInsets.all(30),
                  borderRadius: BorderRadius.circular(30),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Create\nAccount 🇹🇳',
                          style: Theme.of(context)
                              .textTheme
                              .displayLarge
                              ?.copyWith(height: 1.2, color: AppColors.textPrimary),
                        ).animate().fadeIn(duration: 600.ms).slideX(begin: -0.2),

                        const SizedBox(height: 8),
                        Text(
                          'Join us to discover the real Tunisia',
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ).animate().fadeIn(delay: 200.ms, duration: 600.ms),

                        const SizedBox(height: 36),

                        _field('Full Name', 'Ahmed Ben Ali', Icons.person_outline_rounded,
                            _nameC, (v) => v!.isEmpty ? 'Required' : null)
                            .animate().fadeIn(delay: 300.ms).slideY(begin: 0.2),
                        const SizedBox(height: 18),
                        
                        _field('Email', 'ahmed@email.com', Icons.mail_outline_rounded,
                            _emailC, (v) => v!.contains('@') ? null : 'Invalid email',
                            type: TextInputType.emailAddress)
                            .animate().fadeIn(delay: 400.ms).slideY(begin: 0.2),
                        const SizedBox(height: 18),
                        
                        _field('Password', '••••••••', Icons.lock_outline_rounded, _passC,
                            (v) => v!.length < 6 ? 'Min 6 characters' : null,
                            obscure: true)
                            .animate().fadeIn(delay: 500.ms).slideY(begin: 0.2),
                        const SizedBox(height: 18),
                        
                        _field('Country', 'Tunisia', Icons.public_rounded, _countryC, null)
                            .animate().fadeIn(delay: 600.ms).slideY(begin: 0.2),

                        const SizedBox(height: 32),

                        if (auth.error != null)
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: AppColors.error.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.error.withOpacity(0.3)),
                            ),
                            child: Text(auth.error!,
                                style: const TextStyle(color: AppColors.error),
                                textAlign: TextAlign.center),
                          ).animate().fadeIn().shake(),

                        SizedBox(
                          width: double.infinity,
                          height: 56,
                          child: ElevatedButton(
                            onPressed: auth.isLoading
                                ? null
                                : () async {
                                    if (_formKey.currentState!.validate()) {
                                      final success = await auth.register({
                                        'fullName': _nameC.text.trim(),
                                        'email': _emailC.text.trim(),
                                        'password': _passC.text,
                                        'country': _countryC.text.trim(),
                                      });
                                      if (success && mounted) {
                                        Navigator.pushReplacementNamed(context, '/main');
                                      }
                                    }
                                  },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                              elevation: 5,
                              shadowColor: AppColors.primary.withOpacity(0.4),
                            ),
                            child: auth.isLoading
                                ? const SizedBox(
                                    width: 24, height: 24,
                                    child: CircularProgressIndicator(
                                        color: Colors.white, strokeWidth: 2.5))
                                : const Text('Create Account',
                                    style: TextStyle(fontSize: 17, color: Colors.white,
                                        fontWeight: FontWeight.w600)),
                          ),
                        ).animate().fadeIn(delay: 700.ms).slideY(begin: 0.2),

                        const SizedBox(height: 24),

                        Center(
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Text('Already have an account? ', style: TextStyle(color: AppColors.textSecondary)),
                              GestureDetector(
                                onTap: () => Navigator.pop(context),
                                child: const Text('Sign In',
                                    style: TextStyle(
                                        color: AppColors.primary,
                                        fontWeight: FontWeight.w700)),
                              ),
                            ],
                          ),
                        ).animate().fadeIn(delay: 800.ms),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _field(String label, String hint, IconData icon,
      TextEditingController ctrl, String? Function(String?)? validator,
      {bool obscure = false, TextInputType? type}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary.withOpacity(0.8))),
        const SizedBox(height: 8),
        TextFormField(
          controller: ctrl,
          obscureText: obscure && _obscure,
          keyboardType: type,
          validator: validator,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon, color: AppColors.textLight, size: 20),
            filled: true,
            fillColor: Colors.white.withOpacity(0.8),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: Colors.white, width: 2),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: AppColors.primary, width: 2),
            ),
            suffixIcon: obscure
                ? IconButton(
                    icon: Icon(
                      _obscure ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                      color: AppColors.textLight, size: 20,
                    ),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  )
                : null,
          ),
        ),
      ],
    );
  }
}