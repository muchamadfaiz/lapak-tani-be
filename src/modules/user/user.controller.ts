import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, PageOptionsDto, ResponseMessage, Roles } from '../../common';
import { CreateUserDto, UpdateProfileDto, UpdateUserDto } from './dto';
import {
  FindAllUsersUseCase,
  FindUserByIdUseCase,
  CreateUserUseCase,
  UpdateUserUseCase,
  UpdateProfileUseCase,
  RemoveUserUseCase,
} from './use-cases';

@ApiBearerAuth()
@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly findAllUsersUseCase: FindAllUsersUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly removeUserUseCase: RemoveUserUseCase,
  ) {}

  @Patch('me')
  @ApiOperation({ summary: 'Update own profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ResponseMessage('Success update profile')
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.updateProfileUseCase.execute({ userId, dto });
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of users' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ResponseMessage('Success get users')
  findAll(@Query() query: PageOptionsDto) {
    return this.findAllUsersUseCase.execute(query);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ResponseMessage('Success get user')
  findById(@Param('id') id: string) {
    return this.findUserByIdUseCase.execute(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Email already exists or validation failed' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ResponseMessage('Success create user')
  create(@Body() dto: CreateUserDto) {
    return this.createUserUseCase.execute(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ResponseMessage('Success update user')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.updateUserUseCase.execute({ id, dto });
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Soft delete a user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 204, description: 'User soft deleted' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage('Success delete user')
  remove(@Param('id') id: string) {
    return this.removeUserUseCase.execute(id);
  }
}
